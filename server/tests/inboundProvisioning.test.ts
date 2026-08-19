import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const syncAssistant = vi.fn();
const provisionInboundNumber = vi.fn();

// Mock only our own provider-selection boundary (voice/index.ts), not the
// individual engines — this lets us simulate "a real provider is connected"
// deterministically without live Retell/Exotel credentials, the same way
// googleAuth.test.ts mocks config/firebase.ts for Firebase Auth.
let currentProvider = 'retell';
vi.mock('../src/voice/index.js', () => ({
  getVoiceEngine: () => ({
    provider: currentProvider,
    syncAssistant,
    provisionInboundNumber,
  }),
}));

const { createApp } = await import('../src/app.js');
const app = createApp();

async function registerAndAuth() {
  const res = await request(app).post('/api/auth/register').send({
    orgName: 'Acme Co',
    name: 'Owner One',
    email: `owner${Date.now()}${Math.random()}@acme.test`,
    password: 'password123',
  });
  expect(res.status).toBe(201);
  return res.body.data.tokens.accessToken as string;
}

/** Drives an inbound employee through every gate up to (but not including) activation. */
async function readyInboundEmployee(auth: (r: request.Test) => request.Test) {
  const created = await auth(
    request(app).post('/api/ai-employees').send({ type: 'inbound', name: 'Riya', department: 'Front Desk' }),
  ).expect(201);
  const id = created.body.data.id;

  await auth(
    request(app)
      .post(`/api/ai-employees/${id}/knowledge`)
      .send({ kind: 'description', title: 'About', content: 'We sell widgets.' }),
  ).expect(201);
  await auth(
    request(app)
      .put(`/api/ai-employees/${id}/responsibilities`)
      .send({ items: [{ label: 'Answer questions', kind: 'preset', enabled: true }] }),
  ).expect(200);
  await auth(
    request(app)
      .patch(`/api/ai-employees/${id}/phone`)
      .send({ businessPhoneNumber: '+14155550100', escalationNumber: '+14155550111' }),
  ).expect(200);
  await auth(
    request(app).patch(`/api/ai-employees/${id}/billing`).send({ brand: 'visa', last4: '4242' }),
  ).expect(200);
  await auth(request(app).post(`/api/ai-employees/${id}/mark-tested`)).expect(200);

  return id;
}

describe('inbound provisioning at activation', () => {
  beforeEach(() => {
    syncAssistant.mockReset();
    provisionInboundNumber.mockReset();
    currentProvider = 'retell';
  });

  it('binds assistant + real number on a real provider and overwrites the placeholder number', async () => {
    syncAssistant.mockResolvedValue({ assistantId: 'agent_123' });
    provisionInboundNumber.mockResolvedValue({ phoneNumber: '+18005551234' });

    const token = await registerAndAuth();
    const auth = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);
    const id = await readyInboundEmployee(auth);

    const activated = await auth(request(app).post(`/api/ai-employees/${id}/activate`)).expect(200);
    expect(activated.body.data.status).toBe('active');
    expect(activated.body.data.assistantExternalId).toBe('agent_123');
    expect(activated.body.data.voiceProvider).toBe('retell');
    // The wizard-typed number was a placeholder — replaced with the real one.
    expect(activated.body.data.businessPhoneNumber).toBe('+18005551234');

    expect(syncAssistant).toHaveBeenCalledWith(id);
    expect(provisionInboundNumber).toHaveBeenCalledWith(id);
  });

  it('does not call the provider and leaves voiceProvider unset on the mock engine', async () => {
    currentProvider = 'mock';
    const token = await registerAndAuth();
    const auth = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);
    const id = await readyInboundEmployee(auth);

    const activated = await auth(request(app).post(`/api/ai-employees/${id}/activate`)).expect(200);
    expect(activated.body.data.status).toBe('active');
    expect(activated.body.data.voiceProvider).toBeUndefined();
    expect(activated.body.data.businessPhoneNumber).toBe('+14155550100'); // unchanged
    expect(syncAssistant).not.toHaveBeenCalled();
    expect(provisionInboundNumber).not.toHaveBeenCalled();
  });

  it('fails activation (does not go live) when the provider has no number available', async () => {
    syncAssistant.mockResolvedValue({ assistantId: 'agent_123' });
    provisionInboundNumber.mockRejectedValue(new Error('No phone numbers in the Retell account'));

    const token = await registerAndAuth();
    const auth = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);
    const id = await readyInboundEmployee(auth);

    const res = await auth(request(app).post(`/api/ai-employees/${id}/activate`)).expect(400);
    expect(res.body.error.message).toMatch(/retell/i);

    const check = await auth(request(app).get(`/api/ai-employees/${id}`)).expect(200);
    expect(check.body.data.status).not.toBe('active');
  });

  it('blocks editing the phone number after it is provider-managed', async () => {
    syncAssistant.mockResolvedValue({ assistantId: 'agent_123' });
    provisionInboundNumber.mockResolvedValue({ phoneNumber: '+18005551234' });

    const token = await registerAndAuth();
    const auth = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);
    const id = await readyInboundEmployee(auth);
    await auth(request(app).post(`/api/ai-employees/${id}/activate`)).expect(200);

    const res = await auth(
      request(app)
        .patch(`/api/ai-employees/${id}/phone`)
        .send({ businessPhoneNumber: '+14155559999', escalationNumber: '+14155550111' }),
    ).expect(400);
    expect(res.body.error.message).toMatch(/managed by retell/i);
  });
});
