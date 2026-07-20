import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const app = createApp();

async function registerAndAuth() {
  const res = await request(app).post('/api/auth/register').send({
    orgName: 'Acme Co',
    name: 'Owner One',
    email: `owner${Date.now()}@acme.test`,
    password: 'password123',
  });
  expect(res.status).toBe(201);
  return res.body.data.tokens.accessToken as string;
}

describe('auth', () => {
  it('registers, logs in, and returns me', async () => {
    const email = `login${Date.now()}@acme.test`;
    await request(app)
      .post('/api/auth/register')
      .send({ orgName: 'Acme', name: 'Ann', email, password: 'password123' })
      .expect(201);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);
    const token = login.body.data.tokens.accessToken;

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(me.body.data.user.email).toBe(email);
    expect(me.body.data.user.role).toBe('owner');
  });

  it('rejects unauthenticated access', async () => {
    await request(app).get('/api/ai-employees').expect(401);
  });
});

describe('inbound employee lifecycle', () => {
  it('blocks activation until all steps complete, then meters a call', async () => {
    const token = await registerAndAuth();
    const auth = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);

    const created = await auth(
      request(app).post('/api/ai-employees').send({
        type: 'inbound',
        name: 'Reception AI',
        department: 'Front Desk',
      }),
    ).expect(201);
    const id = created.body.data.id;

    // Activation should fail with precondition list.
    const blocked = await auth(request(app).post(`/api/ai-employees/${id}/activate`)).expect(409);
    expect(blocked.body.error.code).toBe('PRECONDITION_FAILED');
    expect(blocked.body.error.details.missing.length).toBeGreaterThan(0);

    // Complete steps.
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

    const activated = await auth(request(app).post(`/api/ai-employees/${id}/activate`)).expect(200);
    expect(activated.body.data.status).toBe('active');

    // Simulate an inbound call → usage recorded.
    await auth(
      request(app).post(`/api/dev/simulate-inbound/${id}`).send({ durationSec: 125 }),
    ).expect(201);

    const usage = await auth(request(app).get('/api/billing/usage')).expect(200);
    expect(usage.body.data.totalCalls).toBe(1);
    expect(usage.body.data.totalMinutes).toBe(3); // ceil(125/60)=3
    expect(usage.body.data.totalUsd).toBeCloseTo(0.3, 5);
  });
});

describe('employee phone validation', () => {
  it('rejects invalid numbers and normalizes valid ones to E.164', async () => {
    const token = await registerAndAuth();
    const auth = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);
    const created = await auth(
      request(app).post('/api/ai-employees').send({ type: 'inbound', name: 'Phone AI', department: 'Ops' }),
    ).expect(201);
    const id = created.body.data.id;

    await auth(
      request(app)
        .patch(`/api/ai-employees/${id}/phone`)
        .send({ businessPhoneNumber: '+1 415 555 0100', escalationNumber: 'nonsense' }),
    ).expect(400);

    // Indian (+91) and US both accepted and normalized.
    const ok = await auth(
      request(app)
        .patch(`/api/ai-employees/${id}/phone`)
        .send({ businessPhoneNumber: '+91 98765 43210', escalationNumber: '+1 (415) 555-0111' }),
    ).expect(200);
    expect(ok.body.data.businessPhoneNumber).toBe('+919876543210');
    expect(ok.body.data.escalationNumber).toBe('+14155550111');
  });
});

describe('contacts import', () => {
  it('flags invalid phone numbers', async () => {
    const token = await registerAndAuth();
    const csv = 'name,phone\nAlice,+14155550101\nBadRow,not-a-phone\n';
    const res = await request(app)
      .post('/api/contacts/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(csv), { filename: 'contacts.csv', contentType: 'text/csv' })
      .expect(201);
    expect(res.body.data.imported).toBe(1);
    expect(res.body.data.invalid.length).toBe(1);
    expect(res.body.data.invalid[0].reason).toMatch(/Invalid phone/);
  });
});
