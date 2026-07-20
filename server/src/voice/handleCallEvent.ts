import { Call } from '../models/Call.js';
import { UsageRecord } from '../models/UsageRecord.js';
import { Campaign } from '../models/Campaign.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import type { CallEvent } from './VoiceEngine.js';

/**
 * Provider-agnostic sink for call-end events. Persists the Call, meters usage
 * idempotently (unique callId on UsageRecord), and updates campaign stats.
 * Both MockVoiceEngine and a future VapiVoiceEngine feed into this.
 */
export async function handleCallEnded(event: CallEvent) {
  const durationSec = event.durationSec ?? 0;
  const outcome = event.outcome ?? 'completed';

  const call = await Call.create({
    organizationId: event.organizationId,
    aiEmployeeId: event.aiEmployeeId,
    direction: event.direction,
    from: event.from,
    to: event.to,
    contactId: event.contactId ?? null,
    campaignId: event.campaignId ?? null,
    startedAt: new Date(Date.now() - durationSec * 1000),
    endedAt: new Date(),
    durationSec,
    outcome,
    escalated: event.escalated ?? false,
    transcript: event.transcript ?? [],
    provider: event.externalCallId.startsWith('vapi') ? 'vapi' : 'mock',
    externalCallId: event.externalCallId,
  });

  // Meter billable usage: ceil to the minute at the configured rate. Idempotent per call.
  const minutes = Math.max(1, Math.ceil(durationSec / 60));
  const rateUsd = env.RATE_USD_PER_MINUTE;
  try {
    await UsageRecord.create({
      organizationId: event.organizationId,
      aiEmployeeId: event.aiEmployeeId,
      callId: call._id,
      minutes,
      rateUsd,
      amountUsd: Number((minutes * rateUsd).toFixed(4)),
      billedAt: new Date(),
    });
  } catch (err) {
    // Duplicate key => already metered; safe to ignore.
    if ((err as { code?: number }).code !== 11000) throw err;
  }

  if (event.campaignId) {
    const connected = outcome === 'completed' || outcome === 'transferred';
    await Campaign.updateOne(
      { _id: event.campaignId },
      {
        $inc: {
          'stats.attempted': 1,
          'stats.connected': connected ? 1 : 0,
          'stats.failed': connected ? 0 : 1,
        },
      },
    );
  }

  logger.info({ callId: String(call._id), durationSec, minutes, outcome }, 'Call metered');
  return call;
}
