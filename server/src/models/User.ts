import mongoose, { Schema, type InferSchemaType } from 'mongoose';
import { ROLES } from '@vorizon/shared';

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Optional: absent for accounts created via Google sign-in that have never
    // set a password.
    passwordHash: { type: String, default: null },
    // Set once a Google account is linked (by verified-email match on first
    // Google sign-in, or account creation via Google). No `default` here on
    // purpose — a sparse unique index only excludes documents where the field
    // is truly absent; a `default: null` would make every password-only user
    // store `googleId: null` explicitly, colliding on the very next signup.
    googleId: { type: String, unique: true, sparse: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    role: { type: String, enum: ROLES, default: 'member' },
    // One hashed refresh token per active session (device/browser). Rotated
    // per-session on refresh so a second device/tab doesn't invalidate the
    // first. Capped to the most recent MAX_SESSIONS entries on push.
    refreshTokenHashes: { type: [String], default: [] },
    // Password-reset OTP (hashed) sent via email; single-use with expiry.
    resetOtpHash: { type: String, default: null },
    resetOtpExpiresAt: { type: Date, default: null },
    // Wrong-guess counter for the reset OTP; the code is burned after too many.
    resetOtpAttempts: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = mongoose.model('User', userSchema);
