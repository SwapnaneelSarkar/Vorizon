import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { LEAD_STATUSES } from '@vorizon/shared';

/**
 * A lead entering the closed loop — from an ad-platform webhook, a connector,
 * or manual push. Flows: new → qualifying → qualified/unqualified → contacted →
 * converted/lost, driven by the lead pipeline (leads.service.ts).
 */
const leadSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    source: { type: String, default: 'manual' }, // ConnectorProvider | 'manual' | 'webhook'
    externalId: { type: String, default: '' }, // dedupe key from the source platform
    name: { type: String, required: true },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    company: { type: String, default: '' },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', default: null, index: true },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', default: null },
    status: { type: String, enum: LEAD_STATUSES, default: 'new', index: true },
    score: { type: Number, default: null },
    aiSummary: { type: String, default: '' },
    raw: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

// Dedupe leads redelivered by a platform (unique per org+source+externalId when present).
leadSchema.index(
  { organizationId: 1, source: 1, externalId: 1 },
  { unique: true, partialFilterExpression: { externalId: { $type: 'string', $ne: '' } } },
);

export type LeadDoc = InferSchemaType<typeof leadSchema>;
export const Lead = mongoose.model('Lead', leadSchema);
