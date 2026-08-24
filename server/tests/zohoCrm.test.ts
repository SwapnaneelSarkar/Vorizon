import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HydratedDocument } from 'mongoose';
import { Connection, type ConnectionDoc } from '../src/models/Connection.js';
import { encryptToken, decryptToken } from '../src/modules/integrations/crypto.js';
import { getValidAccessToken } from '../src/modules/integrations/integrations.service.js';
import { syncLeadToZoho } from '../src/modules/integrations/crm/zohoCrm.js';

const ORG = '6acc000000000000000000aa';

afterEach(() => vi.restoreAllMocks());

function connectZoho(over: Partial<ConnectionDoc> = {}) {
  return Connection.create({
    organizationId: ORG,
    provider: 'zoho',
    status: 'connected',
    accessTokenEnc: encryptToken('access_current'),
    refreshTokenEnc: encryptToken('refresh_permanent'),
    apiDomain: 'https://www.zohoapis.com',
    expiresAt: new Date(Date.now() + 3_600_000),
    ...over,
  }) as Promise<HydratedDocument<ConnectionDoc>>;
}

describe('OAuth token refresh', () => {
  it('returns the stored access token when still valid (no refresh call)', async () => {
    const conn = await connectZoho();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect(await getValidAccessToken(conn)).toBe('access_current');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('refreshes an expired token via the refresh token and persists the new one', async () => {
    const conn = await connectZoho({ expiresAt: new Date(Date.now() - 1000) });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ access_token: 'access_new', expires_in: 3600, api_domain: 'https://www.zohoapis.com' }), { status: 200 }),
    );
    expect(await getValidAccessToken(conn)).toBe('access_new');
    // Called the token endpoint with a refresh_token grant.
    expect(String(fetchSpy.mock.calls[0][0])).toContain('accounts.zoho.com/oauth/v2/token');
    expect(String((fetchSpy.mock.calls[0][1] as RequestInit).body)).toContain('grant_type=refresh_token');
    // Persisted the new token + a future expiry.
    const fresh = await Connection.findById(conn._id);
    expect(decryptToken(fresh!.accessTokenEnc)).toBe('access_new');
    expect(fresh!.expiresAt!.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('syncLeadToZoho', () => {
  it('creates a Zoho CRM Lead with the required fields and returns the record id', async () => {
    await connectZoho();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: [{ code: 'SUCCESS', status: 'success', details: { id: 'zoho_123' } }] }), { status: 201 }),
    );

    const id = await syncLeadToZoho(ORG, { name: 'Priya Sharma', phone: '+14155551234', email: 'p@co.com', source: 'meta_ads' });
    expect(id).toBe('zoho_123');

    const [url, opts] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe('https://www.zohoapis.com/crm/v2/Leads');
    expect((opts as RequestInit).headers).toMatchObject({ Authorization: 'Zoho-oauthtoken access_current' });
    const body = JSON.parse(String((opts as RequestInit).body));
    expect(body.data[0].Last_Name).toBe('Sharma');
    expect(body.data[0].First_Name).toBe('Priya');
    expect(body.data[0].Company).toBeTruthy(); // Zoho Leads require Company
    expect(body.data[0].Phone).toBe('+14155551234');
    expect(body.data[0].Lead_Source).toBe('meta_ads');
  });

  it('is a no-op (null, no HTTP call) when Zoho is not connected', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    expect(await syncLeadToZoho(ORG, { name: 'No CRM' })).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('records the error on the connection and returns null when Zoho rejects', async () => {
    const conn = await connectZoho();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: [{ code: 'MANDATORY_NOT_FOUND', status: 'error', message: 'required field missing' }] }), { status: 400 }),
    );
    expect(await syncLeadToZoho(ORG, { name: 'Broken Lead' })).toBeNull();
    const fresh = await Connection.findById(conn._id);
    expect(fresh!.lastError).toMatch(/sync failed/i);
  });
});
