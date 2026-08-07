import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { BILLING_STATUSES } from '@vorizon/shared';

const organizationSchema = new Schema(
  {
    name: { type: String, required: true },
    plan: { type: String, enum: ['free', 'usage'], default: 'usage' },
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
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export type OrganizationDoc = InferSchemaType<typeof organizationSchema>;
export const Organization = mongoose.model('Organization', organizationSchema);
