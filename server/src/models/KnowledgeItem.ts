import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { KNOWLEDGE_KINDS } from '@vorizon/shared';

const chunkSchema = new Schema(
  {
    text: { type: String, required: true },
    embedding: { type: [Number], default: undefined }, // reserved for Phase 2 RAG
  },
  { _id: false },
);

const knowledgeItemSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    aiEmployeeId: { type: Schema.Types.ObjectId, ref: 'AIEmployee', required: true, index: true },
    kind: { type: String, enum: KNOWLEDGE_KINDS, required: true },
    title: { type: String, required: true },
    content: { type: String, default: '' },
    sourceFile: {
      type: {
        firestoreFileId: String, // raw upload stored in Firestore (when Firebase is on)
        mime: String,
        originalName: String,
        sizeBytes: Number,
      },
      default: undefined,
    },
    parsedText: { type: String, default: '' },
    chunks: { type: [chunkSchema], default: [] },
  },
  { timestamps: true },
);

export type KnowledgeItemDoc = InferSchemaType<typeof knowledgeItemSchema>;
export const KnowledgeItem = mongoose.model('KnowledgeItem', knowledgeItemSchema);
