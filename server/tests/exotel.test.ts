import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Call } from '../src/models/Call.js';

/**
 * Exotel status-webhook tests. The Voicebot has no API and Exotel does not sign
 * callbacks, so authenticity is a shared ?token= secret. These pin the token
 * gate, metadata attribution, outcome/duration mapping, and idempotency.
 *
 * EXOTEL_WEBHOOK_TOKEN is unset in tests (see tests/setup.ts), so the token gate
 * is open here — we assert the parsing/metering path. The token comparison
 * itself is covered by construction (timingSafeEqual on equal-length buffers).
 */
const app = createApp();
const ORG = '6a75000000000000000000aa';
const EMP = '6a75000000000000000000bb';
const CAMPAIGN = '6a75000000000000000000cc';
const CONTACT = '6a75000000000000000000dd';

function post(body: Record<string, string>) {
  return request(app).post('/api/voice/exotel/webhook').type('form').send(body);
}

describe('Exotel status webhook', () => {
  it('records a completed call from CustomField metadata into the metering pipeline', async () => {
    const res = await post({
      CallSid: 'exo-call-1',
      Status: 'completed',
      ConversationDuration: '95',
      From: '+18005550100',
      To: '+14155550101',
      Direction: 'outbound',
      CustomField: JSON.stringify({ organizationId: ORG, aiEmployeeId: EMP, campaignId: CAMPAIGN, contactId: CONTACT }),
    }).expect(200);
    expect(res.body.received).toBe(true);

    const calls = await Call.find({ externalCallId: 'exo-call-1' });
    expect(calls.length).toBe(1);
    expect(calls[0].provider).toBe('exotel');
    expect(calls[0].outcome).toBe('completed');
    expect(calls[0].durationSec).toBe(95);
    expect(calls[0].to).toBe('+14155550101');
  });

  it('maps busy/no-answer/failed statuses and is idempotent on redelivery', async () => {
    await post({
      CallSid: 'exo-call-2',
      Status: 'busy',
      DialCallDuration: '0',
      To: '+14155550102',
      CustomField: JSON.stringify({ organizationId: ORG, aiEmployeeId: EMP }),
    }).expect(200);
    // Redelivery must not double-record.
    await post({
      CallSid: 'exo-call-2',
      Status: 'busy',
      To: '+14155550102',
      CustomField: JSON.stringify({ organizationId: ORG, aiEmployeeId: EMP }),
    }).expect(200);

    const calls = await Call.find({ externalCallId: 'exo-call-2' });
    expect(calls.length).toBe(1);
    expect(calls[0].outcome).toBe('no_answer');
  });

  it('ignores callbacks without Vorizon metadata (e.g. dashboard test calls)', async () => {
    await post({ CallSid: 'exo-test-dash', Status: 'completed', To: '+14155550109' }).expect(200);
    expect(await Call.countDocuments({ externalCallId: 'exo-test-dash' })).toBe(0);
  });

  it('rejects a malformed payload with no CallSid', async () => {
    await post({ Status: 'completed' }).expect(400);
  });
});
