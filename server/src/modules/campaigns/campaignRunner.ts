import type { CallOutcome } from '@vorizon/shared';
import { Campaign, type CampaignDoc } from '../../models/Campaign.js';
import { Contact } from '../../models/Contact.js';
import { AIEmployee } from '../../models/AIEmployee.js';
import { Organization } from '../../models/Organization.js';
import { User } from '../../models/User.js';
import { env } from '../../config/env.js';
import { getVoiceEngine } from '../../voice/index.js';
import { handleCallEnded } from '../../voice/handleCallEvent.js';
import { logger } from '../../utils/logger.js';
import { sendNotificationEmail } from '../email/email.service.js';
import {
  callBlockReason,
  getRecordingDisclosure,
  hasCallingConsent,
  recordSkippedCall,
} from '../compliance/compliance.service.js';

/** Deterministic mock outcome so runs are reproducible (no Math.random). */
function mockOutcome(seed: number): { outcome: CallOutcome; durationSec: number; escalated: boolean } {
  const cycle = seed % 5;
  if (cycle === 3) return { outcome: 'no_answer', durationSec: 0, escalated: false };
  if (cycle === 4) return { outcome: 'failed', durationSec: 0, escalated: false };
  if (cycle === 2) return { outcome: 'transferred', durationSec: 90 + ((seed * 7) % 120), escalated: true };
  return { outcome: 'completed', durationSec: 60 + ((seed * 13) % 180), escalated: false };
}

const RETRYABLE: CallOutcome[] = ['no_answer', 'failed'];

/**
 * Process one campaign to completion. Runs in the background (not in the request
 * path). Respects dailyCallLimit and retryAttempts, and stops early if the
 * campaign is paused.
 *
 * Compliance: aborts unless the org has recorded calling consent, and every
 * contact is re-checked against opt-out + the DNC list immediately before
 * dialing (the lists may change mid-run).
 *
 * With a real voice engine (Retell), dials are initiated here and outcomes
 * arrive later via the provider webhook. With the mock engine, outcomes are
 * simulated synchronously through the shared metering pipeline.
 */
export async function runCampaign(orgId: string, campaignId: string): Promise<void> {
  const campaign = await Campaign.findOne({ _id: campaignId, organizationId: orgId });
  if (!campaign || campaign.status !== 'running') return;
  const employee = await AIEmployee.findById(campaign.aiEmployeeId);
  if (!employee) return;

  // Defense in depth: launch already requires consent, but re-verify at run time.
  if (!(await hasCallingConsent(orgId))) {
    logger.warn({ campaignId, orgId }, 'Campaign paused: calling consent not recorded');
    campaign.status = 'paused';
    await campaign.save();
    return;
  }

  const disclosure = await getRecordingDisclosure(orgId);
  const engine = getVoiceEngine();
  // Distinguishes calls across re-launches of the same campaign (mock ids must
  // stay unique — handleCallEnded dedupes on externalCallId).
  const runId = Date.now();

  const contacts = await Contact.find({
    organizationId: orgId,
    campaignId: campaign._id,
    validationStatus: 'valid',
    optedOut: { $ne: true },
  }).limit(campaign.dailyCallLimit);

  for (let i = 0; i < contacts.length; i++) {
    // Honor pause/stop between contacts.
    const current = await Campaign.findById(campaignId).select('status');
    if (!current || current.status !== 'running') return;

    const contact = contacts[i];

    // Pre-dial compliance gate: opt-out and DNC re-checked per call.
    const blocked = await callBlockReason(orgId, contact);
    if (blocked) {
      await recordSkippedCall(orgId, campaignId, contact.phone, blocked);
      continue;
    }

    if (engine.startOutboundCall) {
      // Real telephony: initiate the dial; the outcome (duration, transcript,
      // metering) arrives via the provider webhook. Dial failures are recorded
      // as failed calls so campaign stats stay truthful.
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
        await emit(orgId, String(employee._id), campaign, contact, { outcome: 'failed', durationSec: 0, escalated: false }, 0, runId);
      }
      continue;
    }

    // Mock telephony: simulate the outcome (with retries) synchronously.
    let attempt = 0;
    let result = mockOutcome(i);
    await emit(orgId, String(employee._id), campaign, contact, result, attempt, runId);

    // Retry failed/no-answer calls up to retryAttempts (interval is a no-op in mock).
    while (RETRYABLE.includes(result.outcome) && attempt < campaign.retryAttempts) {
      attempt += 1;
      result = mockOutcome(i + attempt * 7);
      await emit(orgId, String(employee._id), campaign, contact, result, attempt, runId);
    }
  }

  const fresh = await Campaign.findById(campaignId);
  if (fresh && fresh.status === 'running') {
    fresh.status = 'completed';
    await fresh.save();
    await notifyCampaignCompleted(orgId, fresh);
  }
  logger.info({ campaignId, provider: engine.provider }, 'Campaign run finished');
}

/** Email the org owner a completion summary. Fire-and-forget. */
async function notifyCampaignCompleted(
  orgId: string,
  campaign: CampaignDoc & { _id?: unknown },
): Promise<void> {
  try {
    const org = await Organization.findById(orgId).select('createdBy');
    const owner = org?.createdBy ? await User.findById(org.createdBy).select('email') : null;
    if (!owner?.email) return;
    const s = campaign.stats;
    await sendNotificationEmail(
      owner.email,
      `Campaign "${campaign.name}" completed`,
      `Attempted ${s?.attempted ?? 0} of ${s?.total ?? 0} contacts — ${s?.connected ?? 0} connected, ${s?.failed ?? 0} failed.`,
      { label: 'View campaigns', url: `${env.APP_BASE_URL}/campaigns` },
    );
  } catch (err) {
    logger.warn({ err, campaignId: String(campaign._id ?? '') }, 'Campaign completion email failed');
  }
}

async function emit(
  orgId: string,
  employeeId: string,
  campaign: { _id: unknown },
  contact: { _id: unknown; phone: string },
  result: { outcome: CallOutcome; durationSec: number; escalated: boolean },
  attempt: number,
  runId: number,
) {
  await handleCallEnded({
    externalCallId: `mock-outbound-${runId}-${String(campaign._id)}-${String(contact._id)}-${attempt}`,
    status: 'ended',
    direction: 'outbound',
    organizationId: orgId,
    aiEmployeeId: employeeId,
    from: '+18005550100',
    to: contact.phone,
    contactId: String(contact._id),
    campaignId: String(campaign._id),
    durationSec: result.durationSec,
    outcome: result.outcome,
    escalated: result.escalated,
  });
}
