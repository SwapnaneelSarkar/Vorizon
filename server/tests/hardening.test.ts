import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { campaignQueue } from '../src/modules/campaigns/campaignQueue.js';

const app = createApp();

async function newOwner(email = `owner${Date.now()}${Math.floor(performance.now())}@t.co`) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ orgName: 'Org', name: 'Owner', email, password: 'password123' })
    .expect(201);
  return { token: res.body.data.tokens.accessToken as string, email };
}

const bearer = (t: string) => (r: request.Test) => r.set('Authorization', `Bearer ${t}`);

describe('password policy + change-password', () => {
  it('rejects weak passwords on register', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ orgName: 'O', name: 'Weak', email: `w${Date.now()}@t.co`, password: 'allletters' })
      .expect(400);
  });

  it('changes password with correct current, rejects wrong current', async () => {
    const { token } = await newOwner();
    const auth = bearer(token);
    await auth(
      request(app).post('/api/auth/change-password').send({ currentPassword: 'wrong', newPassword: 'newpass123' }),
    ).expect(401);
    await auth(
      request(app)
        .post('/api/auth/change-password')
        .send({ currentPassword: 'password123', newPassword: 'newpass123' }),
    ).expect(204);
  });
});

describe('RBAC + team management', () => {
  it('lets owner add a member but blocks the member from managing users', async () => {
    const { token } = await newOwner();
    const auth = bearer(token);
    const memberEmail = `member${Date.now()}@t.co`;
    await auth(
      request(app)
        .post('/api/organizations/users')
        .send({ name: 'Mem', email: memberEmail, role: 'member', password: 'member123' }),
    ).expect(201);

    const list = await auth(request(app).get('/api/organizations/users')).expect(200);
    expect(list.body.data.length).toBe(2);

    // Member logs in and is forbidden from team management.
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: memberEmail, password: 'member123' })
      .expect(200);
    const memberAuth = bearer(login.body.data.tokens.accessToken);
    await memberAuth(request(app).get('/api/organizations/users')).expect(403);
    await memberAuth(
      request(app).post('/api/organizations/users').send({ name: 'x', email: 'x@t.co', role: 'member' }),
    ).expect(403);
  });

  it('prevents demoting the last owner', async () => {
    const { token } = await newOwner();
    const auth = bearer(token);
    const me = await auth(request(app).get('/api/auth/me')).expect(200);
    const ownerId = me.body.data.user.id;
    await auth(
      request(app).patch(`/api/organizations/users/${ownerId}/role`).send({ role: 'member' }),
    ).expect(400);
  });
});

describe('multi-tenant isolation', () => {
  it('prevents one org from reading another org employee', async () => {
    const a = await newOwner();
    const b = await newOwner();
    const created = await bearer(a.token)(
      request(app).post('/api/ai-employees').send({ type: 'inbound', name: 'Alpha', department: 'X' }),
    ).expect(201);
    const id = created.body.data.id;
    await bearer(b.token)(request(app).get(`/api/ai-employees/${id}`)).expect(404);
  });
});

describe('async campaign runner', () => {
  it('launches asynchronously and completes via the queue', async () => {
    const { token } = await newOwner();
    const auth = bearer(token);

    const emp = await auth(
      request(app).post('/api/ai-employees').send({ type: 'outbound', name: 'Sam', department: 'Sales' }),
    ).expect(201);
    const eid = emp.body.data.id;
    await auth(
      request(app)
        .post(`/api/ai-employees/${eid}/knowledge`)
        .send({ kind: 'description', title: 'k', content: 'sales script' }),
    ).expect(201);
    await auth(
      request(app)
        .put(`/api/ai-employees/${eid}/responsibilities`)
        .send({ items: [{ label: 'Generate leads', kind: 'preset', enabled: true }] }),
    ).expect(200);
    await auth(
      request(app).patch(`/api/ai-employees/${eid}/billing`).send({ cardType: 'credit', brand: 'visa', last4: '4242' }),
    ).expect(200);
    await auth(request(app).post(`/api/ai-employees/${eid}/mark-tested`)).expect(200);

    const csv = 'name,phone\nA,+14155550101\nB,+14155550102\nC,+14155550103\n';
    await auth(
      request(app)
        .post('/api/contacts/upload')
        .attach('file', Buffer.from(csv), { filename: 'c.csv', contentType: 'text/csv' }),
    ).expect(201);

    const camp = await auth(
      request(app).post('/api/campaigns').send({ name: 'Camp', aiEmployeeId: eid, dailyCallLimit: 100 }),
    ).expect(201);
    const cid = camp.body.data.id;

    // AI calling requires recorded consent before launch (TCPA gate).
    await auth(request(app).post('/api/compliance/consent').send({ accepted: true })).expect(200);

    const launched = await auth(request(app).post(`/api/campaigns/${cid}/launch`)).expect(200);
    expect(launched.body.data.status).toBe('running'); // returns immediately

    await campaignQueue.drain(); // wait for background job

    const after = await auth(request(app).get(`/api/campaigns/${cid}`)).expect(200);
    expect(after.body.data.status).toBe('completed');
    expect(after.body.data.stats.attempted).toBeGreaterThanOrEqual(3);
    expect(after.body.data.stats.total).toBe(3);
  });
});
