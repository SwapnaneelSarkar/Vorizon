import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { PAYMENT_STATUSES } from '@vorizon/shared';

/** One Razorpay order and its lifecycle. Amounts are in paise (INR minor unit). */
const paymentSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, default: null },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: PAYMENT_STATUSES, default: 'created', index: true },
    purpose: { type: String, default: 'billing_activation' },
    failureReason: { type: String, default: '' },
    // How the payment was confirmed: browser checkout callback or Razorpay webhook.
    verifiedVia: { type: String, enum: ['checkout', 'webhook'], default: null },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type PaymentDoc = InferSchemaType<typeof paymentSchema>;
export const Payment = mongoose.model('Payment', paymentSchema);
