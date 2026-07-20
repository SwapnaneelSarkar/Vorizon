import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { CAMPAIGN_STATUSES } from '@vorizon/shared';

const scheduleSchema = new Schema(
  {
    tz: { type: String, default: 'UTC' },
    days: { type: [Number], default: [1, 2, 3, 4, 5] },
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' },
  },
  { _id: false },
);

const campaignSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    aiEmployeeId: { type: Schema.Types.ObjectId, ref: 'AIEmployee', required: true },
    name: { type: String, required: true },
    callingSchedule: { type: scheduleSchema, default: () => ({}) },
    retryAttempts: { type: Number, default: 0 },
    retryInterval: { type: Number, default: 60 },
    dailyCallLimit: { type: Number, default: 100 },
    status: { type: String, enum: CAMPAIGN_STATUSES, default: 'draft', index: true },
    stats: {
      type: {
        total: { type: Number, default: 0 },
        attempted: { type: Number, default: 0 },
        connected: { type: Number, default: 0 },
        failed: { type: Number, default: 0 },
      },
      default: () => ({ total: 0, attempted: 0, connected: 0, failed: 0 }),
    },
  },
  { timestamps: true },
);

export type CampaignDoc = InferSchemaType<typeof campaignSchema>;
export const Campaign = mongoose.model('Campaign', campaignSchema);
