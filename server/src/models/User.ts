import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { ROLES } from '@vorizon/shared';

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    role: { type: String, enum: ROLES, default: 'member' },
    refreshTokenHash: { type: String, default: null },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = mongoose.model('User', userSchema);
