import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const usageRecordSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    aiEmployeeId: { type: Schema.Types.ObjectId, ref: 'AIEmployee', required: true },
    callId: { type: Schema.Types.ObjectId, ref: 'Call', required: true, unique: true },
    minutes: { type: Number, required: true },
    rateUsd: { type: Number, required: true },
    amountUsd: { type: Number, required: true },
    billedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

export type UsageRecordDoc = InferSchemaType<typeof usageRecordSchema>;
export const UsageRecord = mongoose.model('UsageRecord', usageRecordSchema);
