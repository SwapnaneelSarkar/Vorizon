import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { EMPLOYEE_STATUSES, EMPLOYEE_TYPES } from '@vorizon/shared';

const workingHoursSchema = new Schema(
  {
    tz: { type: String, default: 'UTC' },
    days: { type: [Number], default: [1, 2, 3, 4, 5] },
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' },
  },
  { _id: false },
);

const aiEmployeeSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    type: { type: String, enum: EMPLOYEE_TYPES, required: true },
    name: { type: String, required: true },
    department: { type: String, default: '' },
    language: { type: String, default: 'en-US' },
    voice: { type: String, default: 'default' },
    workingHours: { type: workingHoursSchema, default: () => ({}) },
    status: { type: String, enum: EMPLOYEE_STATUSES, default: 'draft', index: true },
    businessPhoneNumber: { type: String, default: null },
    escalationNumber: { type: String, default: null },
    tone: { type: String, default: '' },
    behavior: { type: String, default: '' },
    rules: { type: [String], default: [] },
    tested: { type: Boolean, default: false },
    billingConfigured: { type: Boolean, default: false },
    assistantExternalId: { type: String, default: null },
    // The provider LLM object backing this employee's agent (Retell: retell_llm_id).
    // Kept so a re-sync updates the same objects instead of leaking new ones.
    assistantLlmId: { type: String, default: null },
    // Which voice provider assistantExternalId/businessPhoneNumber were bound
    // under at activation — lets us tell "connected to real telephony" apart
    // from "mock" without depending on whatever VOICE_PROVIDER is set to now.
    voiceProvider: { type: String, default: null },
    activatedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

aiEmployeeSchema.index({ organizationId: 1, type: 1 });
// Reverse lookup for inbound-call attribution: a real inbound call only tells us
// the dialed number, so we find the active inbound employee bound to it.
aiEmployeeSchema.index({ businessPhoneNumber: 1, type: 1, status: 1 });

export type AIEmployeeDoc = InferSchemaType<typeof aiEmployeeSchema>;
export const AIEmployee = mongoose.model('AIEmployee', aiEmployeeSchema);
