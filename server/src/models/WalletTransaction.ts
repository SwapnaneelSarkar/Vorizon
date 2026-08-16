import mongoose, { Schema, type InferSchemaType } from 'mongoose';

/** Ledger of every wallet credit (payment) and debit (metered usage). */
const walletTransactionSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amountUsd: { type: Number, required: true },
    balanceAfterUsd: { type: Number, required: true },
    reason: { type: String, default: '' },
    ref: { type: String, default: '' }, // paymentId / callId
  },
  { timestamps: true },
);

walletTransactionSchema.index({ organizationId: 1, createdAt: -1 });

export type WalletTransactionDoc = InferSchemaType<typeof walletTransactionSchema>;
export const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
