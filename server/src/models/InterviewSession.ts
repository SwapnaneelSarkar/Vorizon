import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const messageSchema = new Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const interviewSessionSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    aiEmployeeId: { type: Schema.Types.ObjectId, ref: 'AIEmployee', required: true, index: true },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true },
);

export type InterviewSessionDoc = InferSchemaType<typeof interviewSessionSchema>;
export const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);
