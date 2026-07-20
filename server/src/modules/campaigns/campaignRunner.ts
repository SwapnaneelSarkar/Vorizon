import type { CallOutcome } from '@vorizon/shared';
import { Campaign } from '../../models/Campaign.js';
import { Contact } from '../../models/Contact.js';
import { AIEmployee } from '../../models/AIEmployee.js';
import { handleCallEnded } from '../../voice/handleCallEvent.js';
import { logger } from '../../utils/logger.js';

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
 * campaign is paused. Each simulated call flows through the shared metering
 * pipeline (Call + UsageRecord + campaign stats).
 */
export async function runCampaign(orgId: string, campaignId: string): Promise<void> {
  const campaign = await Campaign.findOne({ _id: campaignId, organizationId: orgId });
  if (!campaign || campaign.status !== 'running') return;
  const employee = await AIEmployee.findById(campaign.aiEmployeeId);
  if (!employee) return;

  const contacts = await Contact.find({
    organizationId: orgId,
    campaignId: campaign._id,
    validationStatus: 'valid',
  }).limit(campaign.dailyCallLimit);

  for (let i = 0; i < contacts.length; i++) {
    // Honor pause/stop between contacts.
    const current = await Campaign.findById(campaignId).select('status');
    if (!current || current.status !== 'running') return;

    const contact = contacts[i];
    let attempt = 0;
    let result = mockOutcome(i);
    await emit(orgId, String(employee._id), campaign, contact, result, attempt);

    // Retry failed/no-answer calls up to retryAttempts (interval is a no-op in mock).
    while (RETRYABLE.includes(result.outcome) && attempt < campaign.retryAttempts) {
      attempt += 1;
      result = mockOutcome(i + attempt * 7);
      await emit(orgId, String(employee._id), campaign, contact, result, attempt);
    }
  }

  const fresh = await Campaign.findById(campaignId);
  if (fresh && fresh.status === 'running') {
    fresh.status = 'completed';
    await fresh.save();
  }
  logger.info({ campaignId }, 'Campaign run finished');
}

async function emit(
  orgId: string,
  employeeId: string,
  campaign: { _id: unknown },
  contact: { _id: unknown; phone: string },
  result: { outcome: CallOutcome; durationSec: number; escalated: boolean },
  attempt: number,
) {
  await handleCallEnded({
    externalCallId: `mock-outbound-${String(campaign._id)}-${String(contact._id)}-${attempt}`,
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
