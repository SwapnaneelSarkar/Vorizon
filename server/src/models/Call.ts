import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { CALL_DIRECTIONS, CALL_OUTCOMES } from '@vorizon/shared';

const transcriptTurnSchema = new Schema(
  {
    role: { type: String, enum: ['ai', 'customer'], required: true },
    text: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const callSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    aiEmployeeId: { type: Schema.Types.ObjectId, ref: 'AIEmployee', required: true },
    direction: { type: String, enum: CALL_DIRECTIONS, required: true },
    from: { type: String, default: '' },
    to: { type: String, default: '' },
    contactId: { type: Schema.Types.ObjectId, ref: 'Contact', default: null },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', default: null, index: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    durationSec: { type: Number, default: 0 },
    outcome: { type: String, enum: CALL_OUTCOMES, default: 'completed' },
    escalated: { type: Boolean, default: false },
    transcript: { type: [transcriptTurnSchema], default: [] },
    provider: { type: String, default: 'mock' },
    externalCallId: { type: String, default: null },
  },
  { timestamps: true },
);

callSchema.index({ organizationId: 1, createdAt: -1 });

// Idempotency at the storage layer: a provider may deliver the same call-ended
// webhook more than once (and concurrently). A unique index on externalCallId
// makes the second insert fail with E11000 instead of creating a duplicate Call
// that would meter + debit the wallet twice. Partial on $type:'string' so the
// legacy `default: null` docs are excluded and never collide on the null value.
callSchema.index(
  { externalCallId: 1 },
  { unique: true, partialFilterExpression: { externalCallId: { $type: 'string' } } },
);

export type CallDoc = InferSchemaType<typeof callSchema>;
export const Call = mongoose.model('Call', callSchema);
