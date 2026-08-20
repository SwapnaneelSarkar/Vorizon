import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Call } from '../src/models/Call.js';
import { Contact } from '../src/models/Contact.js';
import { Campaign } from '../src/models/Campaign.js';
import { credit } from '../src/modules/billing/wallet.service.js';
import { campaignQueue } from '../src/modules/campaigns/campaignQueue.js';
import { resumeCampaign, pauseCampaign } from '../src/modules/campaigns/campaigns.service.js';
import { settleContact } from '../src/modules/campaigns/campaignProgress.js';
import { withinWindow } from '../src/modules/campaigns/schedule.js';

const app = createApp();
const bearer = (t: string) => (r: request.Test) => r.set('Authorization', `Bearer ${t}`);
const OPEN = { tz: 'UTC', days: [0, 1, 2, 3, 4, 5, 6], start: '00:00', end: '23:59' };
const CLOSED = { tz: 'UTC', days: [0, 1, 2, 3, 4, 5, 6], start: '00:00', end: '00:00' }; // zero-width → always closed

/** Build a fully launchable campaign with `n` contacts and the given options. */
async function setupCampaign(opts: {
  contacts: number;
  dailyCallLimit?: number;
  retryAttempts?: number;
  retryInterval?: number;
  schedule?: typeof OPEN;
}) {
  const email = `camp${Date.now()}${Math.floor(performance.now() * 1000) % 100000}@t.co`;
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ orgName: 'Camp Org', name: 'Owner', email, password: 'password123' })
    .expect(201);
  const token = reg.body.data.tokens.accessToken as string;
  const orgId = reg.body.data.user.organizationId as string;
  const auth = bearer(token);

  const emp = await auth(
    request(app).post('/api/ai-employees').send({ type: 'outbound', name: 'Sales AI', department: 'Sales' }),
  ).expect(201);
  const eid = emp.body.data.id;
  await auth(
    request(app).post(`/api/ai-employees/${eid}/knowledge`).send({ kind: 'description', title: 'k', content: 'sells widgets' }),
  ).expect(201);
  await auth(
    request(app).put(`/api/ai-employees/${eid}/responsibilities`).send({ items: [{ label: 'Generate leads', kind: 'preset', enabled: true }] }),
  ).expect(200);
  await auth(request(app).patch(`/api/ai-employees/${eid}/billing`).send({ brand: 'visa', last4: '4242' })).expect(200);
  await auth(request(app).post(`/api/ai-employees/${eid}/mark-tested`)).expect(200);
  await auth(request(app).post('/api/compliance/consent').send({ accepted: true })).expect(200);

  const rows = Array.from({ length: opts.contacts }, (_, i) => `C${i},+1415555${String(1000 + i).padStart(4, '0')}`);
  const csv = `name,phone\n${rows.join('\n')}\n`;
  await auth(request(app).post('/api/contacts/upload').attach('file', Buffer.from(csv), { filename: 'c.csv', contentType: 'text/csv' })).expect(201);

  const camp = await auth(
    request(app).post('/api/campaigns').send({
      name: 'Camp',
      aiEmployeeId: eid,
      dailyCallLimit: opts.dailyCallLimit ?? 100,
      retryAttempts: opts.retryAttempts ?? 0,
      retryInterval: opts.retryInterval ?? 60,
      callingSchedule: opts.schedule ?? OPEN,
    }),
  ).expect(201);
  await credit(orgId, 50, 'seed');
  return { token, orgId, auth, cid: camp.body.data.id as string };
}

describe('campaign engine: calling hours', () => {
  it('withinWindow honors day + time in the configured timezone', () => {
    // 2026-08-20 is a Thursday. 10:00 UTC is inside Mon-Fri 09:00-17:00.
    const thu10 = new Date('2026-08-20T10:00:00Z');
    expect(withinWindow({ tz: 'UTC', days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' }, thu10)).toBe(true);
    // 02:00 UTC is outside the window.
    expect(withinWindow({ tz: 'UTC', days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' }, new Date('2026-08-20T02:00:00Z'))).toBe(false);
    // Saturday is not an allowed weekday.
    expect(withinWindow({ tz: 'UTC', days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' }, new Date('2026-08-22T10:00:00Z'))).toBe(false);
    // Same instant in Kolkata (UTC+5:30) → 15:30, still inside.
    expect(withinWindow({ tz: 'Asia/Kolkata', days: [1, 2, 3, 4, 5], start: '09:00', end: '17:00' }, thu10)).toBe(true);
  });

  it('does not place any call outside the calling window and leaves the campaign running', async () => {
    const { orgId, cid } = await setupCampaign({ contacts: 3, schedule: CLOSED });
    const { launchCampaign } = await import('../src/modules/campaigns/campaigns.service.js');
    await launchCampaign(orgId, cid);
    await campaignQueue.drain();

    expect(await Call.countDocuments({ campaignId: cid })).toBe(0);
    const camp = await Campaign.findById(cid);
    expect(camp?.status).toBe('running'); // deferred, not completed
    expect(await Contact.countDocuments({ campaignId: cid, dialStatus: 'pending' })).toBe(3);
  });
});

describe('campaign engine: daily cap + per-contact state', () => {
  it('dials only up to the cap per run, never re-dials, and continues across runs until done', async () => {
    const { orgId, cid, auth } = await setupCampaign({ contacts: 5, dailyCallLimit: 2, retryAttempts: 0 });
    const { launchCampaign } = await import('../src/modules/campaigns/campaigns.service.js');

    // Run 1: dials exactly 2, leaves 3 pending, stays running (deferred).
    await launchCampaign(orgId, cid);
    await campaignQueue.drain();
    expect(await Contact.countDocuments({ campaignId: cid, dialStatus: 'done' })).toBe(2);
    expect(await Contact.countDocuments({ campaignId: cid, dialStatus: 'pending' })).toBe(3);
    expect((await Campaign.findById(cid))?.status).toBe('running');
    const callsAfter1 = await Call.countDocuments({ campaignId: cid });
    expect(callsAfter1).toBe(2);

    // Run 2: dials 2 more of the REMAINING contacts (no re-dial of the done ones).
    await campaignQueue.enqueue(orgId, cid);
    await campaignQueue.drain();
    expect(await Contact.countDocuments({ campaignId: cid, dialStatus: 'done' })).toBe(4);
    expect(await Call.countDocuments({ campaignId: cid })).toBe(4); // only 2 new calls

    // Run 3: dials the last one and completes.
    await campaignQueue.enqueue(orgId, cid);
    await campaignQueue.drain();
    expect(await Contact.countDocuments({ campaignId: cid, dialStatus: 'done' })).toBe(5);
    expect((await Campaign.findById(cid))?.status).toBe('completed');
    expect(await Call.countDocuments({ campaignId: cid })).toBe(5);
    void auth;
  });
});

describe('campaign engine: retry state machine', () => {
  it('schedules a retry on no-answer within budget, then settles when exhausted', async () => {
    const campaign = { retryAttempts: 1, retryInterval: 30 };
    const contact = await Contact.create({
      organizationId: '000000000000000000000001',
      name: 'X',
      phone: '+14155559999',
      validationStatus: 'valid',
      dialStatus: 'dialing',
      dialAttempts: 1, // first attempt just made
    });

    // Attempt 1 no-answer, budget allows one retry → pending + future nextAttemptAt.
    await settleContact(contact._id, 'no_answer', campaign);
    let fresh = await Contact.findById(contact._id);
    expect(fresh?.dialStatus).toBe('pending');
    expect(fresh?.nextAttemptAt).toBeTruthy();
    expect(fresh!.nextAttemptAt!.getTime()).toBeGreaterThan(Date.now());

    // Simulate the retry dial (attempts now 2) then another no-answer → exhausted → done.
    await Contact.updateOne({ _id: contact._id }, { $set: { dialAttempts: 2 } });
    await settleContact(contact._id, 'no_answer', campaign);
    fresh = await Contact.findById(contact._id);
    expect(fresh?.dialStatus).toBe('done');

    // A connected outcome always settles immediately regardless of attempts.
    const c2 = await Contact.create({
      organizationId: '000000000000000000000001',
      name: 'Y',
      phone: '+14155558888',
      validationStatus: 'valid',
      dialStatus: 'dialing',
      dialAttempts: 1,
    });
    await settleContact(c2._id, 'completed', campaign);
    expect((await Contact.findById(c2._id))?.dialStatus).toBe('done');
  });
});

describe('campaign engine: resume re-enqueues', () => {
  it('a resumed campaign is picked up again and keeps dialing', async () => {
    const { orgId, cid } = await setupCampaign({ contacts: 3, dailyCallLimit: 1 });
    const { launchCampaign } = await import('../src/modules/campaigns/campaigns.service.js');

    await launchCampaign(orgId, cid);
    await campaignQueue.drain();
    const doneAfterLaunch = await Contact.countDocuments({ campaignId: cid, dialStatus: 'done' });
    expect(doneAfterLaunch).toBe(1); // cap=1

    await pauseCampaign(orgId, cid);
    expect((await Campaign.findById(cid))?.status).toBe('paused');

    // Resume must re-enqueue; the in-process queue then runs it and dials more.
    await resumeCampaign(orgId, cid);
    await campaignQueue.drain();
    expect(await Contact.countDocuments({ campaignId: cid, dialStatus: 'done' })).toBe(2);
    expect((await Campaign.findById(cid))?.status).toBe('running');
  });
});
