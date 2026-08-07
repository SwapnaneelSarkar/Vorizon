import { createHmac } from 'node:crypto';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Call } from '../src/models/Call.js';
import { Payment } from '../src/models/Payment.js';
import { User } from '../src/models/User.js';
import { campaignQueue } from '../src/modules/campaigns/campaignQueue.js';
import { isEmailEnabled, sendEmail } from '../src/modules/email/email.service.js';

const app = createApp();

async function newOwner() {
  const email = `owner${Date.now()}${Math.floor(performance.now() * 1000) % 100000}@t.co`;
  const res = await request(app)
    .post('/api/auth/register')
    .send({ orgName: 'Org', name: 'Owner', email, password: 'password123' })
    .expect(201);
  return {
    token: res.body.data.tokens.accessToken as string,
    email,
    orgId: res.body.data.user.organizationId as string,
    userId: res.body.data.user.id as string,
  };
}

const bearer = (t: string) => (r: request.Test) => r.set('Authorization', `Bearer ${t}`);

describe('compliance: consent', () => {
  it('starts unaccepted, rejects accepted:false, records timestamp + ip on accept', async () => {
    const { token } = await newOwner();
    const auth = bearer(token);

    const before = await auth(request(app).get('/api/compliance')).expect(200);
    expect(before.body.data.callingConsent.accepted).toBe(false);

    await auth(request(app).post('/api/compliance/consent').send({ accepted: false })).expect(400);

    const after = await auth(
      request(app).post('/api/compliance/consent').send({ accepted: true }),
    ).expect(200);
    expect(after.body.data.callingConsent.accepted).toBe(true);
    expect(after.body.data.callingConsent.acceptedAt).toBeTruthy();
    expect(after.body.data.callingConsent.ip).toBeTruthy();
  });

  it('blocks members from accepting consent', async () => {
    const { token } = await newOwner();
    const auth = bearer(token);
    await auth(
      request(app)
        .post('/api/organizations/users')
        .send({ name: 'Mem', email: `m${Date.now()}@t.co`, role: 'member', password: 'member123' }),
    ).expect(201);
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: (await User.findOne({ role: 'member' }))!.email, password: 'member123' })
      .expect(200);
    await bearer(login.body.data.tokens.accessToken)(
      request(app).post('/api/compliance/consent').send({ accepted: true }),
    ).expect(403);
  });
});

describe('compliance: DNC + opt-out', () => {
  it('normalizes, dedupes, lists and removes DNC entries', async () => {
    const { token } = await newOwner();
    const auth = bearer(token);

    await auth(request(app).post('/api/compliance/dnc').send({ phone: 'garbage' })).expect(400);

    const added = await auth(
      request(app).post('/api/compliance/dnc').send({ phone: '+1 (415) 555-0100' }),
    ).expect(201);
    expect(added.body.data.phone).toBe('+14155550100');

    // Idempotent re-add.
    await auth(request(app).post('/api/compliance/dnc').send({ phone: '+14155550100' })).expect(201);
    const list = await auth(request(app).get('/api/compliance/dnc')).expect(200);
    expect(list.body.data.total).toBe(1);

    await auth(request(app).delete(`/api/compliance/dnc/${added.body.data.id}`)).expect(204);
    const empty = await auth(request(app).get('/api/compliance/dnc')).expect(200);
    expect(empty.body.data.total).toBe(0);
  });

  it('opt-out adds to DNC and flags matching contacts', async () => {
    const { token } = await newOwner();
    const auth = bearer(token);
    await auth(
      request(app).post('/api/contacts').send({ name: 'Carl', phone: '+14155550122' }),
    ).expect(201);

    await auth(request(app).post('/api/compliance/opt-out').send({ phone: '+14155550122' })).expect(201);

    const contacts = await auth(request(app).get('/api/contacts')).expect(200);
    expect(contacts.body.data.items[0].optedOut).toBe(true);
    const dnc = await auth(request(app).get('/api/compliance/dnc')).expect(200);
    expect(dnc.body.data.items[0].reason).toBe('opt_out');
  });
});

describe('compliance: campaign enforcement', () => {
  it('blocks launch without consent and never dials DNC numbers', async () => {
    const { token } = await newOwner();
    const auth = bearer(token);

    // Build a launchable outbound employee.
    const emp = await auth(
      request(app).post('/api/ai-employees').send({ type: 'outbound', name: 'Sales AI', department: 'Sales' }),
    ).expect(201);
    const id = emp.body.data.id;
    await auth(
      request(app)
        .post(`/api/ai-employees/${id}/knowledge`)
        .send({ kind: 'description', title: 'About', content: 'We sell widgets.' }),
    ).expect(201);
    await auth(
      request(app)
        .put(`/api/ai-employees/${id}/responsibilities`)
        .send({ items: [{ label: 'Generate leads', kind: 'preset', enabled: true }] }),
    ).expect(200);
    await auth(
      request(app).patch(`/api/ai-employees/${id}/billing`).send({ brand: 'visa', last4: '4242' }),
    ).expect(200);
    await auth(request(app).post(`/api/ai-employees/${id}/mark-tested`)).expect(200);

    const csv = 'name,phone\nAllowed,+14155550101\nBlocked,+14155550102\n';
    await request(app)
      .post('/api/contacts/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from(csv), { filename: 'c.csv', contentType: 'text/csv' })
      .expect(201);

    // One of the two numbers goes on the DNC list.
    await auth(request(app).post('/api/compliance/dnc').send({ phone: '+14155550102' })).expect(201);

    const camp = await auth(
      request(app).post('/api/campaigns').send({
        name: 'Q3 Outreach',
        aiEmployeeId: id,
        retryAttempts: 0,
        retryInterval: 30,
        dailyCallLimit: 50,
        callingSchedule: { tz: 'UTC', days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' },
      }),
    ).expect(201);
    const campaignId = camp.body.data.id;

    // No consent yet → precondition failure names the consent step.
    const blocked = await auth(request(app).post(`/api/campaigns/${campaignId}/launch`)).expect(409);
    expect(JSON.stringify(blocked.body.error.details.missing)).toMatch(/consent/i);

    await auth(request(app).post('/api/compliance/consent').send({ accepted: true })).expect(200);
    await auth(request(app).post(`/api/campaigns/${campaignId}/launch`)).expect(200);
    await campaignQueue.drain();

    // The allowed number was dialed; the DNC number never was.
    expect(await Call.countDocuments({ to: '+14155550101' })).toBeGreaterThan(0);
    expect(await Call.countDocuments({ to: '+14155550102' })).toBe(0);
  });
});

describe('payments (Razorpay)', () => {
  const sign = (payload: string, secret: string) =>
    createHmac('sha256', secret).update(payload).digest('hex');

  it('verifies a checkout signature, activates billing, rejects tampered ones', async () => {
    const { token, orgId, userId } = await newOwner();
    const auth = bearer(token);

    await Payment.create({
      organizationId: orgId,
      createdByUserId: userId,
      razorpayOrderId: 'order_ok',
      amount: 50000,
      status: 'created',
    });

    // Wrong signature → 400 and the payment is marked failed.
    await auth(
      request(app).post('/api/payments/verify').send({
        razorpayOrderId: 'order_ok',
        razorpayPaymentId: 'pay_1',
        razorpaySignature: 'bogus',
      }),
    ).expect(400);

    const good = sign('order_ok|pay_1', 'test-rzp-secret');
    const ok = await auth(
      request(app).post('/api/payments/verify').send({
        razorpayOrderId: 'order_ok',
        razorpayPaymentId: 'pay_1',
        razorpaySignature: good,
      }),
    ).expect(200);
    expect(ok.body.data.status).toBe('paid');

    const me = await auth(request(app).get('/api/auth/me')).expect(200);
    expect(me.body.data.organization.billingStatus).toBe('active');

    const history = await auth(request(app).get('/api/payments')).expect(200);
    expect(history.body.data[0].status).toBe('paid');
  });

  it('rejects cross-org verification attempts', async () => {
    const a = await newOwner();
    const b = await newOwner();
    await Payment.create({
      organizationId: a.orgId,
      razorpayOrderId: 'order_a',
      amount: 1000,
      status: 'created',
    });
    await bearer(b.token)(
      request(app).post('/api/payments/verify').send({
        razorpayOrderId: 'order_a',
        razorpayPaymentId: 'pay_x',
        razorpaySignature: sign('order_a|pay_x', 'test-rzp-secret'),
      }),
    ).expect(404);
  });

  it('accepts signed webhooks and rejects unsigned ones', async () => {
    const { orgId } = await newOwner();
    await Payment.create({
      organizationId: orgId,
      razorpayOrderId: 'order_wh',
      amount: 2000,
      status: 'created',
    });

    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_wh', order_id: 'order_wh' } } },
    });

    await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', 'wrong')
      .send(body)
      .expect(401);

    await request(app)
      .post('/api/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', sign(body, 'test-webhook-secret'))
      .send(body)
      .expect(200);

    const paid = await Payment.findOne({ razorpayOrderId: 'order_wh' });
    expect(paid?.status).toBe('paid');
    expect(paid?.verifiedVia).toBe('webhook');
  });
});

describe('Retell webhook', () => {
  const sign = (payload: string) =>
    createHmac('sha256', 'test-retell-key').update(payload).digest('hex');

  it('rejects bad signatures, records signed call_ended events idempotently', async () => {
    const { token, orgId } = await newOwner();
    const emp = await bearer(token)(
      request(app).post('/api/ai-employees').send({ type: 'outbound', name: 'Caller AI', department: 'Sales' }),
    ).expect(201);

    const body = JSON.stringify({
      event: 'call_ended',
      call: {
        call_id: 'retell_call_1',
        direction: 'outbound',
        from_number: '+18005550100',
        to_number: '+14155550199',
        start_timestamp: 1_700_000_000_000,
        end_timestamp: 1_700_000_095_000,
        disconnection_reason: 'user_hangup',
        metadata: { organizationId: orgId, aiEmployeeId: emp.body.data.id },
        transcript_object: [{ role: 'agent', content: 'Hello!' }],
      },
    });

    await request(app)
      .post('/api/voice/retell/webhook')
      .set('Content-Type', 'application/json')
      .set('x-retell-signature', 'nope')
      .send(body)
      .expect(401);

    await request(app)
      .post('/api/voice/retell/webhook')
      .set('Content-Type', 'application/json')
      .set('x-retell-signature', sign(body))
      .send(body)
      .expect(200);

    // Redelivery must not double-record.
    await request(app)
      .post('/api/voice/retell/webhook')
      .set('Content-Type', 'application/json')
      .set('x-retell-signature', sign(body))
      .send(body)
      .expect(200);

    const calls = await Call.find({ externalCallId: 'retell_call_1' });
    expect(calls.length).toBe(1);
    expect(calls[0].provider).toBe('retell');
    expect(calls[0].outcome).toBe('completed');
    expect(calls[0].durationSec).toBe(95);
    expect(calls[0].transcript[0]?.role).toBe('ai');
  });
});

describe('email service', () => {
  it('is a safe no-op when RESEND_API_KEY is not configured', async () => {
    expect(isEmailEnabled).toBe(false);
    const sent = await sendEmail({ to: 'x@t.co', subject: 'Hi', html: '<p>hi</p>' });
    expect(sent).toBe(false);
  });
});

describe('password reset via OTP', () => {
  it('never leaks account existence, verifies OTP, and rotates the password', async () => {
    await request(app).post('/api/auth/forgot-password').send({ email: 'ghost@t.co' }).expect(204);

    const { email } = await newOwner();
    await request(app).post('/api/auth/forgot-password').send({ email }).expect(204);

    // Plant a known OTP (emails are disabled in tests, so the real one is unknowable).
    await User.updateOne(
      { email },
      {
        resetOtpHash: await bcrypt.hash('123456', 10),
        resetOtpExpiresAt: new Date(Date.now() + 60_000),
      },
    );

    await request(app)
      .post('/api/auth/reset-password')
      .send({ email, otp: '000000', newPassword: 'newpass123' })
      .expect(401);

    await request(app)
      .post('/api/auth/reset-password')
      .send({ email, otp: '123456', newPassword: 'newpass123' })
      .expect(204);

    await request(app).post('/api/auth/login').send({ email, password: 'newpass123' }).expect(200);
    // OTP is single-use.
    await request(app)
      .post('/api/auth/reset-password')
      .send({ email, otp: '123456', newPassword: 'other1234' })
      .expect(401);
  });
});
