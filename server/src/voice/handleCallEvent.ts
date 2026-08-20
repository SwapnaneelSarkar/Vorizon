import { Call } from '../models/Call.js';
import { UsageRecord } from '../models/UsageRecord.js';
import { Campaign } from '../models/Campaign.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { debit } from '../modules/billing/wallet.service.js';
import type { CallEvent } from './VoiceEngine.js';

/**
 * Provider-agnostic sink for call-end events. Persists the Call, meters usage
 * idempotently (unique callId on UsageRecord), and updates campaign stats.
 * Both MockVoiceEngine and a future VapiVoiceEngine feed into this.
 */
export async function handleCallEnded(event: CallEvent) {
  const durationSec = event.durationSec ?? 0;
  const outcome = event.outcome ?? 'completed';

  // Idempotent: providers may deliver the same call-ended webhook more than once.
  const existing = await Call.findOne({ externalCallId: event.externalCallId });
  if (existing) return existing;

  let call;
  try {
    call = await Call.create({
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
      provider: event.provider ?? (event.externalCallId.startsWith('vapi') ? 'vapi' : 'mock'),
      externalCallId: event.externalCallId,
    });
  } catch (err) {
    // Lost the concurrent-delivery race: the unique index on externalCallId
    // rejected this duplicate. Return the winning Call without re-metering so a
    // redelivered/concurrent webhook can never double-debit the wallet.
    if ((err as { code?: number }).code === 11000) {
      const winner = await Call.findOne({ externalCallId: event.externalCallId });
      if (winner) return winner;
    }
    throw err;
  }

  // Only meter calls that actually connected. No-answer / failed / zero-duration
  // dials never had talk time, so they are recorded (for stats) but never billed.
  const billable = durationSec > 0 && outcome !== 'no_answer' && outcome !== 'failed';
  if (billable) {
    // Meter billable usage: ceil to the minute at the configured rate. Idempotent per call.
    const minutes = Math.max(1, Math.ceil(durationSec / 60));
    const rateUsd = env.RATE_USD_PER_MINUTE;
    const amountUsd = Number((minutes * rateUsd).toFixed(4));
    let metered = false;
    try {
      await UsageRecord.create({
        organizationId: event.organizationId,
        aiEmployeeId: event.aiEmployeeId,
        callId: call._id,
        minutes,
        rateUsd,
        amountUsd,
        billedAt: new Date(),
      });
      metered = true;
    } catch (err) {
      // Duplicate key => already metered; safe to ignore.
      if ((err as { code?: number }).code !== 11000) throw err;
    }

    // Debit the prepaid wallet once per newly-metered call (idempotent via the
    // UsageRecord unique-callId guard above — a duplicate webhook won't re-debit).
    if (metered && amountUsd > 0) {
      await debit(event.organizationId, amountUsd, 'call', String(call._id)).catch((err) =>
        logger.error({ err, callId: String(call._id) }, 'Wallet debit failed'),
      );
    }
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

  logger.info({ callId: String(call._id), durationSec, outcome, billable }, 'Call recorded');
  return call;
}
