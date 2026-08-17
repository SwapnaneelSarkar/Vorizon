import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { BILLING_STATUSES, PLAN_TYPES } from '@vorizon/shared';

const organizationSchema = new Schema(
  {
    name: { type: String, required: true },
    plan: { type: String, enum: PLAN_TYPES, default: 'standard' },
    billingStatus: { type: String, enum: BILLING_STATUSES, default: 'inactive' },
    paymentMethod: {
      type: {
        cardType: String,
        brand: String,
        last4: String,
        addedAt: Date,
      },
      default: undefined,
    },
    // TCPA-style consent: AI calling stays disabled until explicitly accepted.
    callingConsent: {
      type: {
        accepted: { type: Boolean, default: false },
        acceptedAt: Date,
        acceptedByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
        ip: String,
      },
      default: undefined,
    },
    // Jurisdiction-dependent settings, configurable per organization.
    compliance: {
      type: {
        recordingDisclosure: {
          enabled: { type: Boolean, default: false },
          message: {
            type: String,
            default: 'This call may be recorded for quality and training purposes.',
          },
        },
      },
      default: undefined,
    },
    // Prepaid wallet (USD). Payments credit it; calls debit it. Services are
    // gated on balance > 0 (see wallet.service.ts).
    walletBalanceUsd: { type: Number, default: 0 },
    // When the last low-balance (<$1) email was sent, so we notify once per
    // crossing rather than on every call. Cleared when a top-up lifts the
    // balance back above the threshold.
    walletLowNotifiedAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export type OrganizationDoc = InferSchemaType<typeof organizationSchema>;
export const Organization = mongoose.model('Organization', organizationSchema);
