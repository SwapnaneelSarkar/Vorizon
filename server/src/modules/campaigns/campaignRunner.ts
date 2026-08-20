import type { CallOutcome } from '@vorizon/shared';
import { Campaign } from '../../models/Campaign.js';
import { Contact, type ContactDoc } from '../../models/Contact.js';
import { AIEmployee } from '../../models/AIEmployee.js';
import { getVoiceEngine } from '../../voice/index.js';
import { handleCallEnded } from '../../voice/handleCallEvent.js';
import { logger } from '../../utils/logger.js';
import {
  callBlockReason,
  getRecordingDisclosure,
  hasCallingConsent,
  recordSkippedCall,
} from '../compliance/compliance.service.js';
import { hasBalance } from '../billing/wallet.service.js';
import { withinWindow } from './schedule.js';
import { assessCampaign, completeCampaign } from './campaignProgress.js';

type ContactRecord = ContactDoc & { _id: unknown };

/** When outside the calling window, re-check this often until it opens. */
const OUT_OF_WINDOW_DEFER_MS = 30 * 60 * 1000;
/** When the per-run dial cap is hit with contacts still due, continue later. */
const DAILY_CAP_DEFER_MS = 6 * 60 * 60 * 1000;

/** Deterministic mock outcome so runs are reproducible (no Math.random). */
function mockOutcome(seed: number): { outcome: CallOutcome; durationSec: number; escalated: boolean } {
  const cycle = seed % 5;
  if (cycle === 3) return { outcome: 'no_answer', durationSec: 0, escalated: false };
  if (cycle === 4) return { outcome: 'failed', durationSec: 0, escalated: false };
  if (cycle === 2) return { outcome: 'transferred', durationSec: 90 + ((seed * 7) % 120), escalated: true };
  return { outcome: 'completed', durationSec: 60 + ((seed * 13) % 180), escalated: false };
}

/**
 * Canned transcript for mock calls, so the transcript-viewer UI has something
 * to show without a real voice provider connected. no_answer/failed calls
 * never connect, so they get no transcript — that's accurate, not a gap.
 */
function mockTranscript(
  outcome: CallOutcome,
  employeeName: string,
  contactName: string,
  startedAt: Date,
): { role: 'ai' | 'customer'; text: string; at: string }[] {
  if (outcome === 'no_answer' || outcome === 'failed') return [];

  const lines: { role: 'ai' | 'customer'; text: string }[] = [
    {
      role: 'ai',
      text: `Hi, this is ${employeeName} calling on behalf of our team — is this ${contactName}? This call may be recorded for quality purposes.`,
    },
    { role: 'customer', text: `Yes, speaking. What's this about?` },
    {
      role: 'ai',
      text: `I'm reaching out about your recent inquiry. Do you have a couple of minutes to talk it through?`,
    },
    { role: 'customer', text: `Sure, go ahead.` },
  ];

  if (outcome === 'transferred') {
    lines.push(
      {
        role: 'ai',
        text: `Great — this sounds like something our specialist can help with directly. Let me connect you now.`,
      },
      { role: 'customer', text: `Okay, thank you.` },
    );
  } else {
    lines.push(
      { role: 'ai', text: `Perfect, let me walk you through the details.` },
      { role: 'customer', text: `That makes sense, thanks for explaining.` },
      { role: 'ai', text: `You're welcome — I'll follow up by email with a summary. Have a great day!` },
    );
  }

  return lines.map((line, i) => ({
    ...line,
    at: new Date(startedAt.getTime() + i * 4000).toISOString(),
  }));
}

/**
 * Atomically claim the next dialable contact: flip pending→dialing, stamp the
 * attempt. The atomic findOneAndUpdate means two concurrent workers can never
 * grab the same contact (no duplicate live calls / double billing).
 */
async function claimNextContact(campaignId: unknown, now: Date): Promise<ContactRecord | null> {
  return (await Contact.findOneAndUpdate(
    {
      campaignId,
      validationStatus: 'valid',
      optedOut: { $ne: true },
      dialStatus: 'pending',
      $or: [{ nextAttemptAt: null }, { nextAttemptAt: { $lte: now } }],
    },
    { $set: { dialStatus: 'dialing', lastDialedAt: now }, $inc: { dialAttempts: 1 } },
    { sort: { nextAttemptAt: 1, _id: 1 }, new: true },
  )) as ContactRecord | null;
}

/**
 * Process one campaign run. Dials due contacts up to the per-run cap, honoring
 * calling hours, consent, wallet balance, opt-out/DNC, and per-contact retry
 * state. Returns the epoch-ms time the job should next run (daily-cap remainder,
 * future retries, or closed window), or null when nothing more is queued here
 * (completed, paused, or waiting on async webhook outcomes).
 *
 * Mock engine: outcomes are simulated synchronously through handleCallEnded,
 * which settles the contact + reconciles the campaign. Real engine: dials are
 * initiated and the contact stays 'dialing' until the provider webhook settles it.
 */
export async function runCampaign(orgId: string, campaignId: string): Promise<number | null> {
  const campaign = await Campaign.findOne({ _id: campaignId, organizationId: orgId });
  if (!campaign || campaign.status !== 'running') return null;
  const employee = await AIEmployee.findById(campaign.aiEmployeeId);
  if (!employee) return null;

  // Defense in depth: launch already requires consent, but re-verify at run time.
  if (!(await hasCallingConsent(orgId))) {
    logger.warn({ campaignId, orgId }, 'Campaign paused: calling consent not recorded');
    await Campaign.updateOne({ _id: campaignId }, { status: 'paused' });
    return null;
  }

  // Calling-hours gate: never dial outside the configured window (TCPA). Defer
  // and re-check until the window opens.
  const now = new Date();
  if (!withinWindow(campaign.callingSchedule, now)) {
    logger.info({ campaignId }, 'Outside calling window — deferring');
    return now.getTime() + OUT_OF_WINDOW_DEFER_MS;
  }

  const disclosure = await getRecordingDisclosure(orgId);
  const engine = getVoiceEngine();
  // Distinguishes calls across re-launches (mock ids must stay unique — the
  // Call.externalCallId index dedupes).
  const runId = now.getTime();

  let dials = 0;
  while (dials < campaign.dailyCallLimit) {
    // Honor pause/stop between contacts.
    const current = await Campaign.findById(campaignId).select('status');
    if (!current || current.status !== 'running') return null;

    // Prepaid gate: pause the moment the wallet is depleted so we never place a
    // call the org can't pay for.
    if (!(await hasBalance(orgId))) {
      logger.info({ campaignId, orgId }, 'Campaign paused: wallet balance depleted');
      await Campaign.updateOne({ _id: campaignId }, { status: 'paused' });
      return null;
    }

    const contact = await claimNextContact(campaign._id, now);
    if (!contact) break; // nothing due right now

    // Pre-dial compliance gate: opt-out and DNC re-checked per call.
    const blocked = await callBlockReason(orgId, contact);
    if (blocked) {
      await Contact.updateOne({ _id: contact._id }, { $set: { dialStatus: 'skipped' } });
      await recordSkippedCall(orgId, campaignId, contact.phone, blocked);
      continue; // skips are not billable dials
    }

    dials += 1;

    if (engine.startOutboundCall) {
      // Real telephony: initiate the dial; the contact stays 'dialing' until the
      // provider webhook delivers the outcome (which settles it + reconciles).
      try {
        await engine.startOutboundCall({
          organizationId: orgId,
          aiEmployeeId: String(employee._id),
          campaignId: String(campaign._id),
          contactId: String(contact._id),
          contactName: contact.name,
          to: contact.phone,
          disclosure,
        });
      } catch (err) {
        logger.error({ err, campaignId, to: contact.phone }, 'Outbound dial failed');
        // Record a failed attempt through the shared pipeline (settles/retries).
        await emit(orgId, employee, campaign._id, contact, { outcome: 'failed', durationSec: 0, escalated: false }, runId);
      }
      continue;
    }

    // Mock telephony: simulate the outcome synchronously. handleCallEnded records
    // + meters the call and settles the contact + reconciles the campaign.
    const result = mockOutcome(runId + dials + Number(contact.dialAttempts ?? 0));
    await emit(orgId, employee, campaign._id, contact, result, runId);
  }

  // Decide what happens next based on remaining work.
  const fresh = await Campaign.findById(campaignId).select('status');
  if (!fresh || fresh.status !== 'running') return null;

  const work = await assessCampaign(campaign._id, Date.now());
  if (work.dueNow > 0) {
    // Hit the per-run dial cap with contacts still due — continue later.
    return Date.now() + DAILY_CAP_DEFER_MS;
  }
  if (work.dialing > 0) {
    // Real-telephony dials are in flight; the webhook path completes the campaign.
    return null;
  }
  if (work.futureRetry > 0) {
    // Only future retries remain — reschedule the job for the earliest one.
    return work.earliestFutureMs ?? Date.now() + 60_000;
  }
  // Nothing left — complete now.
  const done = await Campaign.findById(campaignId);
  if (done && done.status === 'running') await completeCampaign(orgId, done);
  logger.info({ campaignId, provider: engine.provider }, 'Campaign run finished');
  return null;
}

async function emit(
  orgId: string,
  employee: { _id: unknown; name: string },
  campaignId: unknown,
  contact: ContactRecord,
  result: { outcome: CallOutcome; durationSec: number; escalated: boolean },
  runId: number,
) {
  const startedAt = new Date(Date.now() - result.durationSec * 1000);
  await handleCallEnded({
    externalCallId: `mock-outbound-${runId}-${String(campaignId)}-${String(contact._id)}-${Number(contact.dialAttempts ?? 0)}`,
    status: 'ended',
    direction: 'outbound',
    organizationId: orgId,
    aiEmployeeId: String(employee._id),
    from: '+18005550100',
    to: contact.phone,
    contactId: String(contact._id),
    campaignId: String(campaignId),
    durationSec: result.durationSec,
    outcome: result.outcome,
    escalated: result.escalated,
    transcript: mockTranscript(result.outcome, employee.name, contact.name, startedAt),
  });
}
