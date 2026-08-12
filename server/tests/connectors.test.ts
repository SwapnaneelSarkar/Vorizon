import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { Connection } from '../src/models/Connection.js';
import { Lead } from '../src/models/Lead.js';
import { encryptToken, decryptToken } from '../src/modules/integrations/crypto.js';
import { handleCallback, leadIntakeToken } from '../src/modules/integrations/integrations.service.js';

const app = createApp();

async function newOwner() {
  const email = `conn${Date.now()}${Math.floor(performance.now() * 1000) % 100000}@t.co`;
  const res = await request(app)
    .post('/api/auth/register')
    .send({ orgName: 'Org', name: 'Owner', email, password: 'password123' })
    .expect(201);
  return {
    token: res.body.data.tokens.accessToken as string,
    orgId: res.body.data.user.organizationId as string,
  };
}
const bearer = (t: string) => (r: request.Test) => r.set('Authorization', `Bearer ${t}`);

describe('token encryption', () => {
  it('round-trips and produces distinct ciphertexts (random IV)', () => {
    const plain = 'ya29.super-secret-oauth-token';
    const a = encryptToken(plain);
    const b = encryptToken(plain);
    expect(a).not.toBe(b); // random iv
    expect(a).not.toContain(plain);
    expect(decryptToken(a)).toBe(plain);
    expect(decryptToken(b)).toBe(plain);
  });
  it('rejects tampered ciphertext', () => {
    const enc = encryptToken('secret');
    const [iv, tag, data] = enc.split('.');
    expect(() => decryptToken(`${iv}.${tag}.${Buffer.from('xxxx').toString('base64')}`)).toThrow();
  });
});

describe('connector catalog', () => {
  it('lists all connectors with configured flags and the lead-intake URL', async () => {
    const { token } = await newOwner();
    const res = await bearer(token)(request(app).get('/api/integrations')).expect(200);
    const { connectors, leadIntakeUrl } = res.body.data;
    expect(connectors.length).toBeGreaterThanOrEqual(12);
    const googleAds = connectors.find((c: { provider: string }) => c.provider === 'google_ads');
    expect(googleAds.name).toBe('Google Ads');
    expect(googleAds.configured).toBe(false); // no OAuth app creds in tests
    expect(googleAds.connection).toBeUndefined();
    expect(leadIntakeUrl).toContain('/api/integrations/leads/inbound/');
  });

  it('returns 503 connecting a provider without server credentials', async () => {
    const { token } = await newOwner();
    const res = await bearer(token)(request(app).post('/api/integrations/hubspot/connect')).expect(503);
    expect(res.body.error.code).toBe('CONNECTOR_NOT_CONFIGURED');
  });

  it('rejects an unknown connector and blocks members from connecting', async () => {
    const { token } = await newOwner();
    const auth = bearer(token);
    await auth(request(app).post('/api/integrations/not_a_thing/connect')).expect(400);

    // A member (not owner/admin) is forbidden from connecting.
    const memberEmail = `m${Date.now()}@t.co`;
    await auth(
      request(app)
        .post('/api/organizations/users')
        .send({ name: 'Member Mo', email: memberEmail, role: 'member', password: 'member123' }),
    ).expect(201);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: memberEmail, password: 'member123' })
      .expect(200);
    await bearer(login.body.data.tokens.accessToken)(
      request(app).post('/api/integrations/hubspot/connect'),
    ).expect(403);
  });
});

describe('OAuth token exchange (handleCallback)', () => {
  const ORG = '6a75000000000000000000ff';
  afterEach(() => vi.unstubAllGlobals());

  it('stores an ENCRYPTED token on a successful exchange', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ access_token: 'at_secret_google', refresh_token: 'rt_x', expires_in: 3600 }),
            { status: 200 },
          ),
      ),
    );
    await handleCallback('google_ads', 'good_code', ORG);
    const conn = await Connection.findOne({ organizationId: ORG, provider: 'google_ads' });
    expect(conn?.status).toBe('connected');
    expect(conn?.accessTokenEnc).toBeTruthy();
    expect(conn?.accessTokenEnc).not.toContain('at_secret_google'); // stored encrypted
    expect(decryptToken(conn!.accessTokenEnc)).toBe('at_secret_google');
    expect(conn?.expiresAt).toBeTruthy();
  });

  it('marks the connection ERROR (not connected) when a provider returns 200 with an { error } body — the Zoho case', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'invalid_code' }), { status: 200 })),
    );
    await expect(handleCallback('zoho', 'bad_code', ORG)).rejects.toThrow();
    const conn = await Connection.findOne({ organizationId: ORG, provider: 'zoho' });
    expect(conn?.status).toBe('error');
    expect(conn?.accessTokenEnc).toBe(''); // never stored a bogus/empty token as "connected"
  });

  it('marks the connection ERROR on a non-2xx exchange (Google 400)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 })),
    );
    await expect(handleCallback('google_ads', 'bad', ORG)).rejects.toThrow();
    const conn = await Connection.findOne({ organizationId: ORG, provider: 'google_ads' });
    expect(conn?.status).toBe('error');
  });
});

describe('OAuth callback state', () => {
  it('redirects to the app with an error on a bad/forged state', async () => {
    const res = await request(app)
      .get('/api/integrations/google_ads/callback?code=abc&state=forged')
      .expect(302);
    expect(res.headers.location).toContain('/integrations?error=invalid_state');
  });
});

describe('lead intake pipeline', () => {
  it('ingests a lead via the tokenized webhook, qualifies it, and lists it', async () => {
    const { token, orgId } = await newOwner();
    const intakeToken = leadIntakeToken(orgId);

    // Wrong token → 401.
    await request(app)
      .post(`/api/integrations/leads/inbound/${orgId}?token=wrong`)
      .send({ name: 'Nope' })
      .expect(401);

    // Correct token → lead created.
    const created = await request(app)
      .post(`/api/integrations/leads/inbound/${orgId}?token=${intakeToken}&source=meta_ads`)
      .send({ name: 'Alice Lead', phone: '+14155551234', email: 'alice@co.com', externalId: 'ext-1' })
      .expect(201);
    expect(created.body.data.name).toBe('Alice Lead');
    expect(created.body.data.source).toBe('meta_ads');

    // Redelivery with same externalId is idempotent.
    await request(app)
      .post(`/api/integrations/leads/inbound/${orgId}?token=${intakeToken}&source=meta_ads`)
      .send({ name: 'Alice Lead', phone: '+14155551234', externalId: 'ext-1' })
      .expect(201);
    expect(await Lead.countDocuments({ organizationId: orgId })).toBe(1);

    // Qualification ran (LLM off in tests → default neutral score, status advances).
    const list = await bearer(token)(request(app).get('/api/leads')).expect(200);
    expect(list.body.data.total).toBe(1);
    const lead = list.body.data.items[0];
    expect(['qualified', 'contacted', 'unqualified']).toContain(lead.status);
    expect(lead.score).toBeGreaterThanOrEqual(0);

    const stats = await bearer(token)(request(app).get('/api/leads/stats')).expect(200);
    expect(stats.body.data.total).toBe(1);
  });

  it('does not call a lead whose number is on the DNC list (compliance gate)', async () => {
    const { token, orgId } = await newOwner();
    const auth = bearer(token);
    await auth(request(app).post('/api/compliance/dnc').send({ phone: '+14155559000' })).expect(201);
    const intakeToken = leadIntakeToken(orgId);
    await request(app)
      .post(`/api/integrations/leads/inbound/${orgId}?token=${intakeToken}`)
      .send({ name: 'Blocked Lead', phone: '+14155559000' })
      .expect(201);
    // Wait for async qualification to settle.
    await new Promise((r) => setTimeout(r, 300));
    const list = await auth(request(app).get('/api/leads')).expect(200);
    // Qualified but never advanced to 'contacted' because DNC blocks the call.
    expect(list.body.data.items[0].status).not.toBe('contacted');
  });

  it('isolates leads between organizations', async () => {
    const a = await newOwner();
    const b = await newOwner();
    await request(app)
      .post(`/api/integrations/leads/inbound/${a.orgId}?token=${leadIntakeToken(a.orgId)}`)
      .send({ name: 'A Lead', phone: '+14155551111' })
      .expect(201);
    const bList = await bearer(b.token)(request(app).get('/api/leads')).expect(200);
    expect(bList.body.data.total).toBe(0);
  });
});
