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
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export type OrganizationDoc = InferSchemaType<typeof organizationSchema>;
export const Organization = mongoose.model('Organization', organizationSchema);
