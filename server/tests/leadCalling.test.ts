import mongoose from 'mongoose';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Call } from '../src/models/Call.js';
import { Contact } from '../src/models/Contact.js';
import { Lead } from '../src/models/Lead.js';
import { Campaign } from '../src/models/Campaign.js';
import { credit } from '../src/modules/billing/wallet.service.js';
import { campaignQueue } from '../src/modules/campaigns/campaignQueue.js';
import { ingestLead, qualifyLead } from '../src/modules/integrations/leads.service.js';
import { handleCallEnded } from '../src/voice/handleCallEvent.js';

const app = createApp();
const bearer = (t: string) => (r: request.Test) => r.set('Authorization', `Bearer ${t}`);

/** Register an org with a launch-ready, tested outbound employee. */
async function orgWithOutbound(opts: { consent?: boolean; funds?: number } = {}) {
  const email = `lead${Date.now()}${Math.floor(performance.now() * 1000) % 100000}@t.co`;
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ orgName: 'Lead Org', name: 'Owner', email, password: 'password123' })
    .expect(201);
  const token = reg.body.data.tokens.accessToken as string;
  const orgId = reg.body.data.user.organizationId as string;
  const auth = bearer(token);

  const emp = await auth(
    request(app).post('/api/ai-employees').send({ type: 'outbound', name: 'Sales AI', department: 'Sales' }),
  ).expect(201);
  const eid = emp.body.data.id;
  await auth(request(app).post(`/api/ai-employees/${eid}/knowledge`).send({ kind: 'description', title: 'k', content: 'sells widgets' })).expect(201);
  await auth(request(app).put(`/api/ai-employees/${eid}/responsibilities`).send({ items: [{ label: 'Generate leads', kind: 'preset', enabled: true }] })).expect(200);
  await auth(request(app).patch(`/api/ai-employees/${eid}/billing`).send({ brand: 'visa', last4: '4242' })).expect(200);
  await auth(request(app).post(`/api/ai-employees/${eid}/mark-tested`)).expect(200);
  if (opts.consent !== false) await auth(request(app).post('/api/compliance/consent').send({ accepted: true })).expect(200);
  if (opts.funds) await credit(orgId, opts.funds, 'seed');
  return { token, orgId, auth, eid };
}

describe('lead → call loop', () => {
  it('dials a qualified lead through the campaign pipeline when the org is ready', async () => {
    const { orgId, auth, eid } = await orgWithOutbound({ consent: true, funds: 20 });

    // Target an OPEN-schedule campaign so the dial is deterministic regardless of
    // wall-clock time (the default lead campaign uses business hours by design).
    const camp = await auth(
      request(app).post('/api/campaigns').send({
        name: 'Lead Outreach',
        aiEmployeeId: eid,
        callingSchedule: { tz: 'UTC', days: [0, 1, 2, 3, 4, 5, 6], start: '00:00', end: '23:59' },
      }),
    ).expect(201);

    const lead = await Lead.create({
      organizationId: orgId,
      source: 'webhook',
      name: 'Hot Lead',
      phone: '+14155551234',
      status: 'new',
      campaignId: camp.body.data.id,
    });
    await qualifyLead(orgId, String(lead._id));
    await campaignQueue.drain();

    // The lead was materialized as a contact and actually dialed through the campaign.
    const contact = await Contact.findOne({ organizationId: orgId, phone: '+14155551234' });
    expect(contact).toBeTruthy();
    expect(String(contact!.campaignId)).toBe(camp.body.data.id);
    expect(await Call.countDocuments({ organizationId: orgId, to: '+14155551234' })).toBeGreaterThan(0);
  });

  it('does NOT dial when the org has no outbound employee / consent / funds (lead waits, not "contacted")', async () => {
    const email = `noemp${Date.now()}@t.co`;
    const reg = await request(app).post('/api/auth/register').send({ orgName: 'No Emp', name: 'Owner', email, password: 'password123' }).expect(201);
    const orgId = reg.body.data.user.organizationId as string;

    const dto = await ingestLead(orgId, 'webhook', { name: 'Waiting Lead', phone: '+14155557777' });
    await qualifyLead(orgId, dto.id);
    await campaignQueue.drain();

    expect(await Call.countDocuments({ organizationId: orgId })).toBe(0);
    const lead = await Lead.findById(dto.id);
    expect(lead?.status).not.toBe('contacted'); // stayed qualified, awaiting setup
  });

  it('marks the lead "contacted" only once its call actually connects', async () => {
    const { orgId } = await orgWithOutbound({ consent: true, funds: 20 });
    const campaign = await Campaign.create({ organizationId: orgId, aiEmployeeId: new mongoose.Types.ObjectId(), name: 'X', status: 'running' });
    const contact = await Contact.create({ organizationId: orgId, name: 'L', phone: '+14155553333', campaignId: campaign._id, validationStatus: 'valid', dialStatus: 'dialing', dialAttempts: 1 });
    const lead = await Lead.create({ organizationId: orgId, source: 'webhook', name: 'L', phone: '+14155553333', status: 'qualified', contactId: contact._id });

    // A no-answer does NOT mark contacted.
    await handleCallEnded({
      externalCallId: 'lead-noans', status: 'ended', direction: 'outbound', organizationId: orgId,
      aiEmployeeId: String(campaign.aiEmployeeId), from: '+1', to: contact.phone,
      contactId: String(contact._id), campaignId: String(campaign._id), durationSec: 0, outcome: 'no_answer',
    });
    expect((await Lead.findById(lead._id))?.status).toBe('qualified');

    // A connected call does.
    await handleCallEnded({
      externalCallId: 'lead-conn', status: 'ended', direction: 'outbound', organizationId: orgId,
      aiEmployeeId: String(campaign.aiEmployeeId), from: '+1', to: contact.phone,
      contactId: String(contact._id), campaignId: String(campaign._id), durationSec: 90, outcome: 'completed',
    });
    expect((await Lead.findById(lead._id))?.status).toBe('contacted');
  });
});
