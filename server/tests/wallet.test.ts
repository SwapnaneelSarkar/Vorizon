import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Organization } from '../src/models/Organization.js';
import { credit, debit, getWallet, hasBalance } from '../src/modules/billing/wallet.service.js';

const app = createApp();

async function newOrg() {
  const email = `wallet${Date.now()}${Math.floor(performance.now() * 1000) % 100000}@t.co`;
  const res = await request(app)
    .post('/api/auth/register')
    .send({ orgName: 'Wallet Org', name: 'Owner', email, password: 'password123' })
    .expect(201);
  return {
    token: res.body.data.tokens.accessToken as string,
    orgId: res.body.data.user.organizationId as string,
  };
}
const bearer = (t: string) => (r: request.Test) => r.set('Authorization', `Bearer ${t}`);

describe('wallet credit/debit', () => {
  it('new orgs start at $0 and are inactive', async () => {
    const { orgId } = await newOrg();
    const w = await getWallet(orgId);
    expect(w.balanceUsd).toBe(0);
    expect(w.active).toBe(false);
    expect(await hasBalance(orgId)).toBe(false);
  });

  it('credit then debit updates the balance and gate state', async () => {
    const { orgId } = await newOrg();
    await credit(orgId, 5, 'payment');
    expect((await getWallet(orgId)).balanceUsd).toBe(5);
    expect(await hasBalance(orgId)).toBe(true);
    await debit(orgId, 2, 'call');
    expect((await getWallet(orgId)).balanceUsd).toBe(3);
  });

  it('flags low balance below $1 (but still active) and inactive at ≤ 0', async () => {
    const { orgId } = await newOrg();
    await credit(orgId, 0.5, 'payment');
    const low = await getWallet(orgId);
    expect(low.active).toBe(true);
    expect(low.low).toBe(true);
    await debit(orgId, 0.5, 'call');
    const empty = await getWallet(orgId);
    expect(empty.balanceUsd).toBe(0);
    expect(empty.active).toBe(false);
    expect(await hasBalance(orgId)).toBe(false);
  });

  it('sends the low-balance email once per crossing (re-arms after top-up)', async () => {
    const { orgId } = await newOrg();
    await credit(orgId, 3, 'payment');
    // Cross below $1 → sets the notified flag.
    await debit(orgId, 2.5, 'call'); // balance 0.5
    let org = await Organization.findById(orgId);
    expect(org?.walletLowNotifiedAt).toBeTruthy();
    // Another debit while already low → flag stays (no re-send).
    const firstNotifiedAt = org?.walletLowNotifiedAt;
    await debit(orgId, 0.1, 'call'); // balance 0.4
    org = await Organization.findById(orgId);
    expect(org?.walletLowNotifiedAt?.getTime()).toBe(firstNotifiedAt?.getTime());
    // Top up above $1 → flag clears (re-armed).
    await credit(orgId, 5, 'payment');
    org = await Organization.findById(orgId);
    expect(org?.walletLowNotifiedAt).toBeNull();
  });
});

describe('wallet API + gating', () => {
  it('exposes the wallet with transactions', async () => {
    const { token, orgId } = await newOrg();
    await credit(orgId, 10, 'payment', 'pay_1');
    await debit(orgId, 0.1, 'call', 'call_1');
    const res = await bearer(token)(request(app).get('/api/billing/wallet')).expect(200);
    expect(res.body.data.balanceUsd).toBeCloseTo(9.9, 4);
    expect(res.body.data.active).toBe(true);
    expect(res.body.data.lowThresholdUsd).toBe(1);
    expect(res.body.data.transactions.length).toBe(2);
    expect(res.body.data.transactions[0].type).toBe('debit'); // newest first
  });

  it('blocks campaign launch when the wallet is empty, allows it once funded', async () => {
    const { token, orgId } = await newOrg();
    const auth = bearer(token);
    // Build a launchable outbound employee + consent + a valid contact.
    const emp = await auth(
      request(app).post('/api/ai-employees').send({ type: 'outbound', name: 'Sales AI', department: 'Sales' }),
    ).expect(201);
    const id = emp.body.data.id;
    await auth(
      request(app).post(`/api/ai-employees/${id}/knowledge`).send({ kind: 'description', title: 'k', content: 'sells widgets' }),
    ).expect(201);
    await auth(
      request(app).put(`/api/ai-employees/${id}/responsibilities`).send({ items: [{ label: 'Generate leads', kind: 'preset', enabled: true }] }),
    ).expect(200);
    await auth(request(app).patch(`/api/ai-employees/${id}/billing`).send({ brand: 'visa', last4: '4242' })).expect(200);
    await auth(request(app).post(`/api/ai-employees/${id}/mark-tested`)).expect(200);
    await auth(request(app).post('/api/compliance/consent').send({ accepted: true })).expect(200);
    const csv = 'name,phone\nA,+14155550101\n';
    await auth(request(app).post('/api/contacts/upload').attach('file', Buffer.from(csv), { filename: 'c.csv', contentType: 'text/csv' })).expect(201);
    const camp = await auth(
      request(app).post('/api/campaigns').send({ name: 'Camp', aiEmployeeId: id, dailyCallLimit: 10 }),
    ).expect(201);
    const cid = camp.body.data.id;

    // Empty wallet → launch blocked with a wallet hint.
    const blocked = await auth(request(app).post(`/api/campaigns/${cid}/launch`)).expect(409);
    expect(JSON.stringify(blocked.body.error.details.missing)).toMatch(/wallet|funds/i);

    // Fund it → launch succeeds.
    await credit(orgId, 5, 'payment');
    await auth(request(app).post(`/api/campaigns/${cid}/launch`)).expect(200);
  });
});
