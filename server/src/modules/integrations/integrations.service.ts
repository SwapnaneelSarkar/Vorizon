import { createHmac, timingSafeEqual } from 'node:crypto';
import type { ConnectionDTO, ConnectorInfo, ConnectorProvider } from '@vorizon/shared';
import { env } from '../../config/env.js';
import { Connection, type ConnectionDoc } from '../../models/Connection.js';
import { ApiError } from '../../utils/apiError.js';
import { recordAudit } from '../../utils/audit.js';
import { logger } from '../../utils/logger.js';
import { CONNECTORS, isConfigured, type ConnectorDef } from './catalog.js';
import { encryptToken, decryptToken } from './crypto.js';

type ConnectionRecord = ConnectionDoc & { _id: unknown; createdAt?: Date };

/**
 * Connectors hidden from the Integrations page and blocked from connecting.
 * - meta_ads: temporarily off pending Meta App Review.
 * - stripe / twilio / salesforce / hubspot / instagram / facebook_pages: not used
 *   by this deployment (payments = Razorpay, telephony = Exotel, CRM = Zoho), so
 *   removed to keep the connector list focused. Delete an entry to bring it back.
 */
const DISABLED_CONNECTORS = new Set<ConnectorProvider>([
  'meta_ads',
  'stripe',
  'twilio',
  'salesforce',
  'hubspot',
  'instagram',
  'facebook_pages',
]);

/**
 * Return a valid (non-expired) access token for a connection, transparently
 * refreshing via the stored refresh token when it has expired. OAuth access
 * tokens (Google/Zoho/Salesforce) live ~1h, so any connector that actually
 * calls a provider API must go through this rather than using the stored token
 * directly. Persists the refreshed token + expiry (and Zoho's api_domain).
 */
export async function getValidAccessToken(connection: ConnectionRecord): Promise<string> {
  const access = decryptToken(connection.accessTokenEnc);
  const stillValid =
    Boolean(access) && connection.expiresAt != null && connection.expiresAt.getTime() > Date.now() + 60_000;
  if (stillValid) return access;

  const refresh = decryptToken(connection.refreshTokenEnc);
  if (!refresh) throw new Error('No refresh token stored — reconnect the integration');

  const def = defOrThrow(connection.provider);
  const res = await fetch(def.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh,
      client_id: String(env[def.clientIdEnv]),
      client_secret: String(env[def.clientSecretEnv]),
    }).toString(),
  });
  const text = await res.text();
  const parsed = (text ? JSON.parse(text) : {}) as {
    access_token?: string;
    expires_in?: number;
    api_domain?: string;
    error?: string;
  };
  if (!res.ok || parsed.error || !parsed.access_token) {
    await Connection.updateOne(
      { _id: connection._id },
      { $set: { status: 'error', lastError: `Token refresh failed: ${parsed.error ?? res.status}` } },
    );
    throw new Error(`token refresh failed: ${parsed.error ?? res.status}`);
  }

  await Connection.updateOne(
    { _id: connection._id },
    {
      $set: {
        accessTokenEnc: encryptToken(parsed.access_token),
        expiresAt: parsed.expires_in ? new Date(Date.now() + parsed.expires_in * 1000) : null,
        ...(parsed.api_domain ? { apiDomain: parsed.api_domain } : {}),
        status: 'connected',
        lastError: '',
      },
    },
  );
  return parsed.access_token;
}

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
  return Object.values(CONNECTORS)
    .filter((def) => !DISABLED_CONNECTORS.has(def.provider))
    .map((def) => {
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
  if (DISABLED_CONNECTORS.has(provider)) {
    throw new ApiError(503, 'CONNECTOR_DISABLED', `${def.name} is temporarily disabled`);
  }
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
  let tokens: { access_token?: string; refresh_token?: string; expires_in?: number; api_domain?: string };
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
    const parsed = (text ? JSON.parse(text) : {}) as typeof tokens & { error?: string };
    // Some providers (e.g. Zoho) return HTTP 200 with an { error } body on
    // failure, so validate the payload — not just the status code — before
    // treating the connection as successful.
    if (!res.ok || parsed.error || !parsed.access_token) {
      logger.error(
        { provider, status: res.status, err: parsed.error, body: text.slice(0, 200) },
        'OAuth token exchange failed',
      );
      throw new Error(`token exchange failed: ${parsed.error ?? res.status}`);
    }
    tokens = parsed;
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
      apiDomain: tokens.api_domain ?? '',
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
