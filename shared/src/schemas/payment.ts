import { z } from 'zod';

/** Amount in INR (rupees); converted to paise server-side. */
export const createPaymentOrderSchema = z.object({
  amountInr: z.number().int().min(1).max(500000),
  purpose: z.enum(['billing_activation', 'wallet_topup']).default('billing_activation'),
});
export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;

/** Fields Razorpay Checkout hands back on success, verified server-side. */
export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

export const paymentFailedSchema = z.object({
  razorpayOrderId: z.string().min(1),
  reason: z.string().max(500).optional(),
});
export type PaymentFailedInput = z.infer<typeof paymentFailedSchema>;
