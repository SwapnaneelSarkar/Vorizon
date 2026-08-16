import { createHmac, timingSafeEqual } from 'node:crypto';
import Razorpay from 'razorpay';
import type { PaymentDTO, PaymentOrderDTO } from '@vorizon/shared';
import { env } from '../../config/env.js';
import { Organization } from '../../models/Organization.js';
import { Payment, type PaymentDoc } from '../../models/Payment.js';
import { User } from '../../models/User.js';
import { ApiError } from '../../utils/apiError.js';
import { recordAudit } from '../../utils/audit.js';
import { logger } from '../../utils/logger.js';
import { sendNotificationEmail } from '../email/email.service.js';
import { credit, inrPaiseToUsd } from '../billing/wallet.service.js';

type PaymentRecord = PaymentDoc & { _id: unknown; createdAt?: Date };

/** Whether Razorpay is configured. Unconfigured → payment endpoints return 503. */
export const isPaymentsEnabled = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);

let client: Razorpay | null = null;

function getClient(): Razorpay {
  if (!isPaymentsEnabled) {
    throw new ApiError(503, 'PAYMENTS_DISABLED', 'Payments are not configured on this server');
  }
  if (!client) {
    client = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
  }
  return client;
}

function toDTO(p: PaymentRecord): PaymentDTO {
  return {
    id: String(p._id),
    razorpayOrderId: p.razorpayOrderId,
    razorpayPaymentId: p.razorpayPaymentId ?? undefined,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    purpose: p.purpose,
    failureReason: p.failureReason || undefined,
    createdAt: p.createdAt?.toISOString() ?? '',
    paidAt: p.paidAt?.toISOString(),
  };
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/**
 * Create a Razorpay order and persist it. The client gets only what Checkout
 * needs (order id + public key id) — the key secret never leaves the server.
 */
export async function createOrder(
  orgId: string,
  userId: string,
  input: { amountInr: number; purpose: string },
): Promise<PaymentOrderDTO> {
  const rzp = getClient();
  const amountPaise = input.amountInr * 100;

  let order: { id: string; amount: string | number; currency: string };
  try {
    order = await rzp.orders.create({
      amount: amountPaise,
      currency: 'INR',
      notes: { organizationId: orgId, purpose: input.purpose },
    });
  } catch (err) {
    logger.error({ err, orgId, amountPaise }, 'Razorpay order creation failed');
    throw new ApiError(502, 'PAYMENT_PROVIDER_ERROR', 'Could not create payment order');
  }

  await Payment.create({
    organizationId: orgId,
    createdByUserId: userId,
    razorpayOrderId: order.id,
    amount: amountPaise,
    currency: order.currency,
    status: 'created',
    purpose: input.purpose,
  });

  return {
    orderId: order.id,
    amount: amountPaise,
    currency: order.currency,
    keyId: env.RAZORPAY_KEY_ID,
  };
}

/**
 * Verify the signature Razorpay Checkout returns on success:
 * HMAC-SHA256(order_id + "|" + payment_id, key_secret).
 */
export function verifyCheckoutSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const expected = createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return safeEqual(expected, signature);
}

/** Verify a webhook body against the X-Razorpay-Signature header. */
export function verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return safeEqual(expected, signature);
}

/** Success flow: mark paid (idempotent), activate org billing, notify + audit. */
export async function markPaid(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  verifiedVia: 'checkout' | 'webhook',
): Promise<PaymentDTO> {
  const payment = (await Payment.findOne({ razorpayOrderId })) as PaymentRecord | null;
  if (!payment) throw ApiError.notFound('Payment order not found');

  // Idempotent: webhook + checkout callback can both confirm the same payment.
  if (payment.status === 'paid') return toDTO(payment);

  payment.status = 'paid';
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.verifiedVia = verifiedVia;
  payment.failureReason = '';
  payment.paidAt = new Date();
  await (payment as unknown as { save(): Promise<unknown> }).save();

  const orgId = String(payment.organizationId);
  // Credit the prepaid wallet with the USD equivalent of the INR payment.
  const creditedUsd = inrPaiseToUsd(payment.amount);
  const balanceUsd = await credit(orgId, creditedUsd, 'payment', String(payment._id));
  await Organization.updateOne({ _id: orgId }, { billingStatus: 'active' });
  await recordAudit({
    organizationId: orgId,
    actorUserId: payment.createdByUserId ? String(payment.createdByUserId) : undefined,
    action: 'payment.succeeded',
    targetType: 'Payment',
    targetId: String(payment._id),
    metadata: { razorpayOrderId, razorpayPaymentId, amount: payment.amount, creditedUsd, verifiedVia },
  });

  const payer = payment.createdByUserId
    ? await User.findById(payment.createdByUserId).select('email')
    : null;
  if (payer?.email) {
    await sendNotificationEmail(
      payer.email,
      'Payment received',
      `Your payment of ₹${(payment.amount / 100).toFixed(2)} added $${creditedUsd.toFixed(2)} to your wallet. New balance: $${balanceUsd.toFixed(2)}.`,
      { label: 'View billing', url: `${env.APP_BASE_URL}/billing` },
    );
  }

  logger.info({ razorpayOrderId, razorpayPaymentId, verifiedVia }, 'Payment captured');
  return toDTO(payment);
}

/** Failure flow: record the failure reason (idempotent; a later success wins). */
export async function markFailed(razorpayOrderId: string, reason: string): Promise<PaymentDTO> {
  const payment = (await Payment.findOne({ razorpayOrderId })) as PaymentRecord | null;
  if (!payment) throw ApiError.notFound('Payment order not found');
  if (payment.status === 'paid') return toDTO(payment); // never downgrade a captured payment

  payment.status = 'failed';
  payment.failureReason = reason || 'Payment failed';
  await (payment as unknown as { save(): Promise<unknown> }).save();

  await recordAudit({
    organizationId: String(payment.organizationId),
    action: 'payment.failed',
    targetType: 'Payment',
    targetId: String(payment._id),
    metadata: { razorpayOrderId, reason },
  });
  logger.warn({ razorpayOrderId, reason }, 'Payment failed');
  return toDTO(payment);
}

export async function listPayments(orgId: string): Promise<PaymentDTO[]> {
  const items = await Payment.find({ organizationId: orgId }).sort({ createdAt: -1 }).limit(100);
  return items.map((p) => toDTO(p as PaymentRecord));
}

/** Scope guard: verify + failure endpoints may only touch the caller's own orders. */
export async function assertOrderInOrg(orgId: string, razorpayOrderId: string): Promise<void> {
  const exists = await Payment.exists({ organizationId: orgId, razorpayOrderId });
  if (!exists) throw ApiError.notFound('Payment order not found');
}
