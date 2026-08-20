import { env } from '../../config/env.js';
import { Organization } from '../../models/Organization.js';
import { User } from '../../models/User.js';
import { WalletTransaction } from '../../models/WalletTransaction.js';
import { logger } from '../../utils/logger.js';
import { sendNotificationEmail } from '../email/email.service.js';

/** Below this USD balance we email a low-balance warning; services still run. */
export const LOW_BALANCE_USD = 1;

const round = (n: number) => Number(n.toFixed(4));

export interface WalletState {
  balanceUsd: number;
  /** Services allowed only when the balance is positive. */
  active: boolean;
  /** Balance is positive but under the low-balance threshold. */
  low: boolean;
}

export async function getWallet(orgId: string): Promise<WalletState> {
  const org = await Organization.findById(orgId).select('walletBalanceUsd');
  const balanceUsd = round(org?.walletBalanceUsd ?? 0);
  return { balanceUsd, active: balanceUsd > 0, low: balanceUsd > 0 && balanceUsd < LOW_BALANCE_USD };
}

/** True when the org has funds to consume paid resources. */
export async function hasBalance(orgId: string): Promise<boolean> {
  const org = await Organization.findById(orgId).select('walletBalanceUsd');
  return (org?.walletBalanceUsd ?? 0) > 0;
}

async function ownerEmail(orgId: string): Promise<string | null> {
  const org = await Organization.findById(orgId).select('createdBy');
  if (!org?.createdBy) return null;
  const owner = await User.findById(org.createdBy).select('email');
  return owner?.email ?? null;
}

/** Credit the wallet (e.g. after a successful payment). Clears the low-balance flag. */
export async function credit(orgId: string, amountUsd: number, reason: string, ref = ''): Promise<number> {
  const amount = round(amountUsd);
  if (amount <= 0) return (await getWallet(orgId)).balanceUsd;
  const org = await Organization.findByIdAndUpdate(
    orgId,
    { $inc: { walletBalanceUsd: amount } },
    { new: true },
  ).select('walletBalanceUsd walletLowNotifiedAt');
  const balanceAfter = round(org?.walletBalanceUsd ?? amount);
  // Re-arm the low-balance notifier once funds are back above the threshold.
  if (balanceAfter >= LOW_BALANCE_USD && org?.walletLowNotifiedAt) {
    await Organization.updateOne({ _id: orgId }, { walletLowNotifiedAt: null });
  }
  await WalletTransaction.create({ organizationId: orgId, type: 'credit', amountUsd: amount, balanceAfterUsd: balanceAfter, reason, ref });
  logger.info({ orgId, amount, balanceAfter, reason }, 'Wallet credited');
  return balanceAfter;
}

/** Convert an INR (paise) payment into a USD wallet credit. */
export function inrPaiseToUsd(paise: number): number {
  return round(paise / 100 / env.USD_INR_RATE);
}

/**
 * Debit the wallet for metered usage. Emits a one-shot low-balance email when
 * the balance first drops under $1, and a depleted email when it hits ≤ 0.
 */
export async function debit(orgId: string, amountUsd: number, reason: string, ref = ''): Promise<number> {
  const amount = round(amountUsd);
  const org = await Organization.findByIdAndUpdate(
    orgId,
    { $inc: { walletBalanceUsd: -amount } },
    { new: true },
  ).select('walletBalanceUsd walletLowNotifiedAt');
  const rawAfter = round(org?.walletBalanceUsd ?? -amount);
  const before = round(rawAfter + amount);

  // Never let the stored balance go negative. Floor it at zero atomically (only
  // when currently below zero, so concurrent debits don't fight). The last dial
  // that overdrew is effectively forgiven; preventing over-dialing in the first
  // place is the campaign runner's per-call balance gate.
  let balanceAfter = rawAfter;
  if (rawAfter < 0) {
    await Organization.updateOne(
      { _id: orgId, walletBalanceUsd: { $lt: 0 } },
      { $set: { walletBalanceUsd: 0 } },
    );
    balanceAfter = 0;
  }

  await WalletTransaction.create({ organizationId: orgId, type: 'debit', amountUsd: amount, balanceAfterUsd: balanceAfter, reason, ref });

  // Crossing into low balance (>$0 but <$1): notify once. Transition detection
  // uses the true post-debit balance (rawAfter), not the floored display value.
  if (rawAfter > 0 && rawAfter < LOW_BALANCE_USD && !org?.walletLowNotifiedAt) {
    await Organization.updateOne({ _id: orgId }, { walletLowNotifiedAt: new Date() });
    const email = await ownerEmail(orgId);
    if (email) {
      // Awaited (not fire-and-forget): on Cloud Functions a detached promise is
      // dropped when the instance freezes. Wrapped so a send failure can't break metering.
      await sendNotificationEmail(
        email,
        'Your Vorizon balance is running low',
        `Your wallet balance is $${balanceAfter.toFixed(2)}. Top up soon to keep your AI employees running.`,
        { label: 'Add funds', url: `${env.APP_BASE_URL}/billing` },
      ).catch((err) => logger.error({ err, orgId }, 'Low-balance email failed'));
    }
  }
  // Crossing to depleted (≤ 0): notify that services are paused.
  if (before > 0 && rawAfter <= 0) {
    const email = await ownerEmail(orgId);
    if (email) {
      await sendNotificationEmail(
        email,
        'Vorizon services paused — balance depleted',
        'Your wallet balance has run out, so AI calling has been paused. Add funds to resume immediately.',
        { label: 'Add funds', url: `${env.APP_BASE_URL}/billing` },
      ).catch((err) => logger.error({ err, orgId }, 'Depleted email failed'));
    }
    logger.info({ orgId }, 'Wallet depleted — services paused');
  }
  return balanceAfter;
}

export async function listTransactions(orgId: string, limit = 50) {
  // _id is a monotonic tiebreaker so same-millisecond txns still order by insertion.
  return WalletTransaction.find({ organizationId: orgId }).sort({ createdAt: -1, _id: -1 }).limit(limit);
}
