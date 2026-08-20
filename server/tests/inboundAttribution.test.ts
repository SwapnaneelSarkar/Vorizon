import { createHmac } from 'node:crypto';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Call } from '../src/models/Call.js';
import { Organization } from '../src/models/Organization.js';
import { AIEmployee } from '../src/models/AIEmployee.js';
import { credit, getWallet } from '../src/modules/billing/wallet.service.js';
import { resolveInboundTarget } from '../src/voice/inboundRouting.js';

const app = createApp();
const BIZ_NUMBER = '+15551239000';

let orgId: string;
let empId: string;

beforeEach(async () => {
  const org = await Organization.create({ name: 'Inbound Org' });
  orgId = String(org._id);
  await credit(orgId, 20, 'seed');
  const emp = await AIEmployee.create({
    organizationId: orgId,
    type: 'inbound',
    name: 'Riley Reception',
    status: 'active',
    businessPhoneNumber: BIZ_NUMBER,
    activatedAt: new Date(),
  });
  empId = String(emp._id);
});

/** Retell signs webhooks with HMAC-SHA256(rawBody, RETELL_API_KEY). */
function retell(body: unknown) {
  const raw = JSON.stringify(body);
  const sig = createHmac('sha256', process.env.RETELL_API_KEY as string).update(raw).digest('hex');
  return request(app)
    .post('/api/voice/retell/webhook')
    .set('Content-Type', 'application/json')
    .set('x-retell-signature', sig)
    .send(raw);
}

describe('inbound attribution helper', () => {
  it('resolves an active inbound employee by dialed number, null for unknown', async () => {
    const hit = await resolveInboundTarget(BIZ_NUMBER);
    expect(hit?.organizationId).toBe(orgId);
    expect(hit?.aiEmployeeId).toBe(empId);
    expect(await resolveInboundTarget('+15550000000')).toBeNull();
  });
});

describe('inbound calls are recorded + billed via number attribution', () => {
  it('Exotel: an inbound call with no CustomField is attributed by the dialed number', async () => {
    await request(app)
      .post('/api/voice/exotel/webhook')
      .type('form')
      .send({
        CallSid: 'exo-inbound-1',
        Status: 'completed',
        ConversationDuration: '75',
        From: '+14155558888', // the caller
        To: BIZ_NUMBER, // the business number they dialed
        Direction: 'incoming',
      })
      .expect(200);

    const call = await Call.findOne({ externalCallId: 'exo-inbound-1' });
    expect(call).toBeTruthy();
    expect(String(call!.organizationId)).toBe(orgId);
    expect(String(call!.aiEmployeeId)).toBe(empId);
    expect(call!.direction).toBe('inbound');
    // A connected inbound call is billed.
    expect((await getWallet(orgId)).balanceUsd).toBeLessThan(20);
  });

  it('Retell: an inbound call with no metadata is attributed by to_number', async () => {
    await retell({
      event: 'call_ended',
      call: {
        call_id: 'retell-inbound-1',
        direction: 'inbound',
        from_number: '+14155557777',
        to_number: BIZ_NUMBER,
        start_timestamp: 1_000_000,
        end_timestamp: 1_090_000, // 90s
        disconnection_reason: 'user_hangup',
      },
    }).expect(200);

    const call = await Call.findOne({ externalCallId: 'retell-inbound-1' });
    expect(call).toBeTruthy();
    expect(String(call!.organizationId)).toBe(orgId);
    expect(call!.direction).toBe('inbound');
    expect(call!.outcome).toBe('completed');
  });

  it('an inbound call to an unrecognized number is acknowledged but not recorded', async () => {
    await request(app)
      .post('/api/voice/exotel/webhook')
      .type('form')
      .send({ CallSid: 'exo-unknown', Status: 'completed', To: '+15559999999', Direction: 'incoming' })
      .expect(200);
    expect(await Call.countDocuments({ externalCallId: 'exo-unknown' })).toBe(0);
  });
});
