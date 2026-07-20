import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { RESPONSIBILITY_KINDS } from '@vorizon/shared';

const responsibilitySchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    aiEmployeeId: { type: Schema.Types.ObjectId, ref: 'AIEmployee', required: true, index: true },
    label: { type: String, required: true },
    kind: { type: String, enum: RESPONSIBILITY_KINDS, default: 'custom' },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type ResponsibilityDoc = InferSchemaType<typeof responsibilitySchema>;
export const Responsibility = mongoose.model('Responsibility', responsibilitySchema);
