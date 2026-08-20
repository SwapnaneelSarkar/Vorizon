import type { CallOutcome } from '@vorizon/shared';
import { Campaign, type CampaignDoc } from '../../models/Campaign.js';
import { Contact } from '../../models/Contact.js';
import { Organization } from '../../models/Organization.js';
import { User } from '../../models/User.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { sendNotificationEmail } from '../email/email.service.js';

/** Outcomes that mean the call never connected and may be retried. */
const RETRYABLE: CallOutcome[] = ['no_answer', 'failed'];

/** How much work a running campaign has left, evaluated at `now`. */
export interface CampaignWork {
  /** Contacts eligible to dial right now (never dialed, or a retry that is due). */
  dueNow: number;
  /** Calls currently in flight (real telephony awaiting a webhook outcome). */
  dialing: number;
  /** Retries scheduled for the future. */
  futureRetry: number;
  /** Earliest future retry time (epoch ms), or null if none. */
  earliestFutureMs: number | null;
}

const dialableBase = (campaignId: unknown) => ({
  campaignId,
  validationStatus: 'valid' as const,
  optedOut: { $ne: true },
});

export async function assessCampaign(campaignId: unknown, now: number): Promise<CampaignWork> {
  const nowDate = new Date(now);
  const [dueNow, dialing, futureRetry, nextDoc] = await Promise.all([
    Contact.countDocuments({
      ...dialableBase(campaignId),
      dialStatus: 'pending',
      $or: [{ nextAttemptAt: null }, { nextAttemptAt: { $lte: nowDate } }],
    }),
    Contact.countDocuments({ ...dialableBase(campaignId), dialStatus: 'dialing' }),
    Contact.countDocuments({
      ...dialableBase(campaignId),
      dialStatus: 'pending',
      nextAttemptAt: { $gt: nowDate },
    }),
    Contact.findOne({
      ...dialableBase(campaignId),
      dialStatus: 'pending',
      nextAttemptAt: { $gt: nowDate },
    })
      .sort({ nextAttemptAt: 1 })
      .select('nextAttemptAt'),
  ]);

  return {
    dueNow,
    dialing,
    futureRetry,
    earliestFutureMs: nextDoc?.nextAttemptAt ? new Date(nextDoc.nextAttemptAt).getTime() : null,
  };
}

/**
 * Record the outcome of one dial against its contact. A connected call settles
 * the contact ('done'); a no-answer/failed schedules a retry (up to the
 * campaign's retryAttempts, spaced by retryInterval) or settles once exhausted.
 * dialAttempts is expected to have already been incremented when the contact
 * was claimed for this dial.
 */
export async function settleContact(
  contactId: unknown,
  outcome: CallOutcome,
  campaign: Pick<CampaignDoc, 'retryAttempts' | 'retryInterval'>,
  now: number = Date.now(),
): Promise<void> {
  const contact = await Contact.findById(contactId).select('dialAttempts');
  if (!contact) return;
  const attempts = contact.dialAttempts ?? 0;

  if (!RETRYABLE.includes(outcome)) {
    await Contact.updateOne({ _id: contactId }, { $set: { dialStatus: 'done', nextAttemptAt: null } });
    return;
  }

  // Retryable: schedule another attempt if the budget allows, else finish.
  if (attempts <= campaign.retryAttempts) {
    const nextAttemptAt = new Date(now + Math.max(0, campaign.retryInterval) * 60_000);
    await Contact.updateOne({ _id: contactId }, { $set: { dialStatus: 'pending', nextAttemptAt } });
  } else {
    await Contact.updateOne({ _id: contactId }, { $set: { dialStatus: 'done', nextAttemptAt: null } });
  }
}

/** Mark the campaign completed and email the owner a summary (best-effort). */
export async function completeCampaign(orgId: string, campaign: CampaignDoc & { _id?: unknown }): Promise<void> {
  await Campaign.updateOne({ _id: campaign._id }, { $set: { status: 'completed' } });
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
    ).catch((err) => logger.warn({ err, campaignId: String(campaign._id ?? '') }, 'Completion email failed'));
  } catch (err) {
    logger.warn({ err, campaignId: String(campaign._id ?? '') }, 'Completion notify failed');
  }
}

/**
 * Decide a running campaign's fate after a call settles (the async/webhook path):
 * complete it when no work remains, or re-enqueue it deferred to the next retry.
 * Does nothing while there is still due or in-flight work — the runner drives that.
 * Idempotent and safe to call repeatedly.
 */
export async function reconcileCampaign(orgId: string, campaignId: string): Promise<void> {
  const campaign = await Campaign.findOne({ _id: campaignId, organizationId: orgId });
  if (!campaign || campaign.status !== 'running') return;

  const now = Date.now();
  const work = await assessCampaign(campaign._id, now);
  if (work.dueNow > 0 || work.dialing > 0) return; // still in progress

  if (work.futureRetry > 0) {
    // Only future retries remain — hand the job back to the queue, due then.
    const { campaignQueue } = await import('./campaignQueue.js');
    await campaignQueue.enqueue(orgId, campaignId, work.earliestFutureMs ?? now + 60_000);
    return;
  }

  await completeCampaign(orgId, campaign);
}
