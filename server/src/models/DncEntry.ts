import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { DNC_REASONS } from '@vorizon/shared';

/**
 * Do-Not-Call registry entry. Phones are stored in E.164; the campaign runner
 * refuses to dial any number present here for the organization.
 */
const dncEntrySchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    phone: { type: String, required: true },
    reason: { type: String, enum: DNC_REASONS, default: 'manual' },
    note: { type: String, default: '' },
    addedByUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

dncEntrySchema.index({ organizationId: 1, phone: 1 }, { unique: true });

export type DncEntryDoc = InferSchemaType<typeof dncEntrySchema>;
export const DncEntry = mongoose.model('DncEntry', dncEntrySchema);
