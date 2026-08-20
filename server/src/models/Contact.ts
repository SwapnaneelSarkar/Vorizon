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
    // Set when the person opts out of AI calls; never dialed again (also on DNC).
    optedOut: { type: Boolean, default: false },
    optedOutAt: { type: Date, default: null },
    // Per-contact dial state, so a campaign never re-dials the same contact on a
    // job retry / resume, and can continue across runs (daily limit, retries).
    //  pending  = never dialed, or a retry that is due (see nextAttemptAt)
    //  dialing  = a call is in flight (real telephony; outcome arrives by webhook)
    //  done     = connected, or retries exhausted — never dialed again
    //  skipped  = blocked by compliance (opt-out / DNC) at dial time
    dialStatus: { type: String, enum: ['pending', 'dialing', 'done', 'skipped'], default: 'pending' },
    dialAttempts: { type: Number, default: 0 },
    lastDialedAt: { type: Date, default: null },
    // When a retry becomes eligible (null = due now). Retries are spaced by the
    // campaign's retryInterval and picked up on a later run.
    nextAttemptAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// The runner selects the next dialable contact by this; keeps selection fast + ordered.
contactSchema.index({ campaignId: 1, dialStatus: 1, nextAttemptAt: 1, _id: 1 });

export type ContactDoc = InferSchemaType<typeof contactSchema>;
export const Contact = mongoose.model('Contact', contactSchema);
