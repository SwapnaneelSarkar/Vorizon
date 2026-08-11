import { createHmac, timingSafeEqual } from 'node:crypto';
import type { ConnectionDTO, ConnectorInfo, ConnectorProvider } from '@vorizon/shared';
import { env } from '../../config/env.js';
import { Connection, type ConnectionDoc } from '../../models/Connection.js';
import { ApiError } from '../../utils/apiError.js';
import { recordAudit } from '../../utils/audit.js';
import { logger } from '../../utils/logger.js';
import { CONNECTORS, isConfigured, type ConnectorDef } from './catalog.js';
import { encryptToken } from './crypto.js';

type ConnectionRecord = ConnectionDoc & { _id: unknown; createdAt?: Date };

/** OAuth redirect URI back to this API. */
function redirectUri(provider: ConnectorProvider): string {
  const base = (env.API_BASE_URL || env.APP_BASE_URL).replace(/\/$/, '');
  return `${base}/api/integrations/${provider}/callback`;
}

/**
 * Signed, expiring OAuth state: HMAC over org+provider+timestamp. Prevents CSRF
 * on the callback and carries the org id without a server-side session.
 */
function signState(orgId: string, provider: string): string {
  const payload = `${orgId}.${provider}.${Date.now()}`;
  const sig = createHmac('sha256', env.JWT_ACCESS_SECRET).update(payload).digest('base64url');
  return `${Buffer.from(payload).toString('base64url')}.${sig}`;
}

export function verifyState(state: string): { orgId: string; provider: string } | null {
  const [payloadB64, sig] = state.split('.');
  if (!payloadB64 || !sig) return null;
  const payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
  const expected = createHmac('sha256', env.JWT_ACCESS_SECRET).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [orgId, provider, tsStr] = payload.split('.');
  // 10-minute validity window.
  if (Date.now() - Number(tsStr) > 10 * 60 * 1000) return null;
  return { orgId, provider };
}

function toDTO(c: ConnectionRecord): ConnectionDTO {
  return {
    id: String(c._id),
    provider: c.provider as ConnectorProvider,
    status: c.status,
    accountLabel: c.accountLabel || undefined,
    connectedAt: c.createdAt?.toISOString(),
    lastError: c.lastError || undefined,
  };
}

/** The catalog joined with this org's live connection status. */
export async function listConnectors(orgId: string): Promise<ConnectorInfo[]> {
  const connections = await Connection.find({ organizationId: orgId });
  const byProvider = new Map(connections.map((c) => [c.provider, c as ConnectionRecord]));
  return Object.values(CONNECTORS).map((def) => {
    const conn = byProvider.get(def.provider);
    return {
      provider: def.provider,
      name: def.name,
      category: def.category,
      description: def.description,
      configured: isConfigured(def),
      connection: conn ? toDTO(conn) : undefined,
    };
  });
}

function defOrThrow(provider: ConnectorProvider): ConnectorDef {
  const def = CONNECTORS[provider];
  if (!def) throw ApiError.badRequest(`Unknown connector: ${provider}`);
  return def;
}

/** Build the provider's OAuth authorize URL for the "Connect" button. */
export function startConnect(orgId: string, provider: ConnectorProvider): { authUrl: string } {
  const def = defOrThrow(provider);
  if (!isConfigured(def)) {
    throw new ApiError(
      503,
      'CONNECTOR_NOT_CONFIGURED',
      `${def.name} is not enabled on this server yet (missing OAuth app credentials)`,
    );
  }
  const params = new URLSearchParams({
    client_id: String(env[def.clientIdEnv]),
    redirect_uri: redirectUri(provider),
    response_type: 'code',
    scope: def.scopes.join(' '),
    state: signState(orgId, provider),
    access_type: 'offline',
    prompt: 'consent',
  });
  return { authUrl: `${def.authUrl}?${params.toString()}` };
}

/**
 * OAuth callback: exchange the authorization code for tokens and persist an
 * encrypted Connection. Returns the provider so the caller can redirect back
 * to the app's integrations page.
 */
export async function handleCallback(
  provider: ConnectorProvider,
  code: string,
  orgId: string,
): Promise<void> {
  const def = defOrThrow(provider);
  let tokens: { access_token?: string; refresh_token?: string; expires_in?: number };
  try {
    const res = await fetch(def.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: String(env[def.clientIdEnv]),
        client_secret: String(env[def.clientSecretEnv]),
        redirect_uri: redirectUri(provider),
      }).toString(),
    });
    const text = await res.text();
    if (!res.ok) {
      logger.error({ provider, status: res.status, body: text.slice(0, 200) }, 'OAuth token exchange failed');
      throw new Error(`token exchange ${res.status}`);
    }
    tokens = JSON.parse(text);
  } catch (err) {
    await Connection.findOneAndUpdate(
      { organizationId: orgId, provider },
      { organizationId: orgId, provider, status: 'error', lastError: 'Token exchange failed' },
      { upsert: true },
    );
    throw new ApiError(502, 'OAUTH_FAILED', 'Could not complete the connection', {
      provider,
      reason: (err as Error).message,
    });
  }

  await Connection.findOneAndUpdate(
    { organizationId: orgId, provider },
    {
      organizationId: orgId,
      provider,
      status: 'connected',
      accessTokenEnc: encryptToken(tokens.access_token ?? ''),
      refreshTokenEnc: encryptToken(tokens.refresh_token ?? ''),
      scopes: def.scopes,
      expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      lastError: '',
    },
    { upsert: true, new: true },
  );
  await recordAudit({
    organizationId: orgId,
    action: 'integration.connected',
    targetType: 'Connection',
    metadata: { provider },
  });
  logger.info({ provider, orgId }, 'Connector connected');
}

/** Stable, unguessable per-org token for the inbound lead webhook URL. */
export function leadIntakeToken(orgId: string): string {
  return createHmac('sha256', env.JWT_ACCESS_SECRET).update(`lead-intake.${orgId}`).digest('base64url');
}

export function leadIntakeUrl(orgId: string): string {
  const base = (env.API_BASE_URL || env.APP_BASE_URL).replace(/\/$/, '');
  return `${base}/api/integrations/leads/inbound/${orgId}?token=${leadIntakeToken(orgId)}`;
}

export function verifyLeadIntakeToken(orgId: string, token: string | undefined): boolean {
  if (!token) return false;
  const expected = leadIntakeToken(orgId);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function disconnect(orgId: string, provider: ConnectorProvider, userId: string): Promise<void> {
  const conn = await Connection.findOne({ organizationId: orgId, provider });
  if (!conn) throw ApiError.notFound('Connection not found');
  await conn.deleteOne();
  await recordAudit({
    organizationId: orgId,
    actorUserId: userId,
    action: 'integration.disconnected',
    targetType: 'Connection',
    metadata: { provider },
  });
}
