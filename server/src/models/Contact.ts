import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { VALIDATION_STATUSES } from '@vorizon/shared';

const contactSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    company: { type: String, default: '' },
    tags: { type: [String], default: [] },
    notes: { type: String, default: '' },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', default: null, index: true },
    validationStatus: { type: String, enum: VALIDATION_STATUSES, default: 'pending' },
  },
  { timestamps: true },
);

export type ContactDoc = InferSchemaType<typeof contactSchema>;
export const Contact = mongoose.model('Contact', contactSchema);
