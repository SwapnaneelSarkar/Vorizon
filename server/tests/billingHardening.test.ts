import mongoose from 'mongoose';
import { beforeAll, describe, expect, it } from 'vitest';
import { Organization } from '../src/models/Organization.js';
import { Call } from '../src/models/Call.js';
import { Payment } from '../src/models/Payment.js';
import { WalletTransaction } from '../src/models/WalletTransaction.js';
import { credit, debit, getWallet } from '../src/modules/billing/wallet.service.js';
import { markPaid } from '../src/modules/payments/payments.service.js';
import { handleCallEnded } from '../src/voice/handleCallEvent.js';
import type { CallEvent } from '../src/voice/VoiceEngine.js';

// Ensure the unique index on Call.externalCallId is built before the dedup test.
beforeAll(async () => {
  await Call.init();
});

const baseEvent = (orgId: string, over: Partial<CallEvent>): CallEvent => ({
  externalCallId: `ext-${Math.random().toString(36).slice(2)}`,
  status: 'ended',
  direction: 'outbound',
  organizationId: orgId,
  aiEmployeeId: String(new mongoose.Types.ObjectId()),
  from: '+18005550100',
  to: '+14155550101',
  durationSec: 120,
  outcome: 'completed',
  ...over,
});

async function fundedOrg(usd: number): Promise<string> {
  const org = await Organization.create({ name: 'Bill Org' });
  await credit(String(org._id), usd, 'seed');
  return String(org._id);
}

describe('billing hardening', () => {
  it('bills connected calls but never no-answer / failed / zero-duration calls', async () => {
    const orgId = await fundedOrg(10);

    // A connected call with talk time is billed.
    await handleCallEnded(baseEvent(orgId, { externalCallId: 'c-completed', durationSec: 120, outcome: 'completed' }));
    const afterCompleted = (await getWallet(orgId)).balanceUsd;
    expect(afterCompleted).toBeLessThan(10);

    // A no-answer (0s) is recorded but not billed.
    await handleCallEnded(baseEvent(orgId, { externalCallId: 'c-noanswer', durationSec: 0, outcome: 'no_answer' }));
    expect((await getWallet(orgId)).balanceUsd).toBe(afterCompleted);

    // A failed dial is recorded but not billed.
    await handleCallEnded(baseEvent(orgId, { externalCallId: 'c-failed', durationSec: 0, outcome: 'failed' }));
    expect((await getWallet(orgId)).balanceUsd).toBe(afterCompleted);

    // All three calls are still recorded for stats/transcripts.
    expect(await Call.countDocuments({ organizationId: orgId })).toBe(3);
    // Exactly one billable debit transaction.
    expect(await WalletTransaction.countDocuments({ organizationId: orgId, type: 'debit' })).toBe(1);
  });

  it('never double-debits when the same call-ended webhook is delivered concurrently', async () => {
    const orgId = await fundedOrg(10);
    const ev = baseEvent(orgId, { externalCallId: 'dup-1', durationSec: 120, outcome: 'completed' });

    // Fire the identical webhook twice at once (provider redelivery / two instances).
    await Promise.all([handleCallEnded(ev), handleCallEnded(ev)]);

    expect(await Call.countDocuments({ externalCallId: 'dup-1' })).toBe(1);
    expect(await WalletTransaction.countDocuments({ organizationId: orgId, type: 'debit' })).toBe(1);
    // 120s = 2 min at $0.08 → one $0.16 debit only.
    expect((await getWallet(orgId)).balanceUsd).toBeCloseTo(10 - 0.16, 4);
  });

  it('floors the wallet at zero instead of going negative on an overdraw', async () => {
    const org = await Organization.create({ name: 'Floor Org' });
    await credit(String(org._id), 1, 'seed');
    await debit(String(org._id), 5, 'call'); // overdraw by $4
    expect((await getWallet(String(org._id))).balanceUsd).toBe(0);
  });

  it('credits a paid order exactly once even under concurrent confirmations', async () => {
    const org = await Organization.create({ name: 'Pay Org' });
    await Payment.create({
      organizationId: org._id,
      razorpayOrderId: 'order_hardening_1',
      amount: 50000, // ₹500 in paise
      currency: 'INR',
      status: 'created',
      purpose: 'wallet_topup',
    });

    // Checkout callback + webhook confirm the same order simultaneously.
    await Promise.all([
      markPaid('order_hardening_1', 'pay_1', 'checkout'),
      markPaid('order_hardening_1', 'pay_1', 'webhook'),
    ]);

    // Exactly one wallet credit for the payment, and the order is paid + active.
    expect(await WalletTransaction.countDocuments({ organizationId: org._id, type: 'credit', reason: 'payment' })).toBe(1);
    const paid = await Payment.findOne({ razorpayOrderId: 'order_hardening_1' });
    expect(paid?.status).toBe('paid');
    const orgAfter = await Organization.findById(org._id);
    expect(orgAfter?.billingStatus).toBe('active');
  });
});
