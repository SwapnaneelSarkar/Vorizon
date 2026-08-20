import { createHash, randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { AuthResponse, LoginInput, RegisterInput, UserDTO } from '@vorizon/shared';
import { Organization } from '../../models/Organization.js';
import { User, type UserDoc } from '../../models/User.js';
import { ApiError } from '../../utils/apiError.js';
import { logger } from '../../utils/logger.js';
import { getAuthAdmin } from '../../config/firebase.js';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../email/email.service.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from './tokens.js';

const RESET_OTP_TTL_MS = 15 * 60 * 1000;
/** Most recent concurrent sessions (devices/browsers) kept per user. */
const MAX_SESSIONS = 10;
/** Wrong reset-OTP guesses before the code is burned. */
const MAX_RESET_ATTEMPTS = 5;

type UserRecord = UserDoc & { _id: unknown };

/**
 * Fingerprint a refresh token for storage. SHA-256 (not bcrypt): a refresh JWT
 * is already high-entropy, and bcrypt silently truncates its input at 72 bytes —
 * a JWT's first 72 bytes are just the header + "{\"userId\":\"…", so the unique
 * jti lands beyond the cutoff and every one of a user's tokens would hash-match
 * every stored session. SHA-256 covers the whole token, so sessions stay distinct.
 */
const fingerprintToken = (token: string) => createHash('sha256').update(token).digest('hex');

function toUserDTO(user: UserRecord): UserDTO {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: String(user.organizationId),
  };
}

/**
 * Start a new session: issue an access + refresh token and append the refresh
 * hash to the user's session list (capped to the last MAX_SESSIONS). Each login
 * on a new device/tab is its own session, so signing in elsewhere no longer
 * logs the first device out.
 */
async function issueTokens(user: UserRecord) {
  const accessToken = signAccessToken({
    userId: String(user._id),
    organizationId: String(user.organizationId),
    role: user.role,
  });
  const refreshToken = signRefreshToken({ userId: String(user._id) });
  await User.updateOne(
    { _id: user._id },
    { $push: { refreshTokenHashes: { $each: [fingerprintToken(refreshToken)], $slice: -MAX_SESSIONS } } },
  );
  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) throw ApiError.conflict('Email already registered');

  const org = await Organization.create({ name: input.orgName });
  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: await bcrypt.hash(input.password, 10),
    organizationId: org._id,
    role: 'owner',
  });
  await Organization.updateOne({ _id: org._id }, { createdBy: user._id });

  // Awaited for serverless (frozen instances drop dangling promises), but never
  // throws — registration succeeds even if email delivery fails.
  await sendWelcomeEmail(user.email, user.name);

  const tokens = await issueTokens(user);
  return { user: toUserDTO(user), tokens };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await User.findOne({ email: input.email.toLowerCase() });
  if (!user?.passwordHash) throw ApiError.unauthorized('Invalid credentials');
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('Invalid credentials');

  const tokens = await issueTokens(user);
  return { user: toUserDTO(user), tokens };
}

/**
 * "Sign in with Google": verifies a Firebase Auth ID token (the client signs
 * in via Firebase's Google provider and hands us the resulting ID token), then
 * signs in an existing user, links Google to an existing password account with
 * the same verified email, or creates a brand-new org + owner for a first-time
 * user — mirroring register()'s org-bootstrap for the "new user" case.
 */
export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  const authAdmin = getAuthAdmin();
  if (!authAdmin) throw ApiError.badRequest('Google sign-in is not configured on this server');

  let decoded;
  try {
    decoded = await authAdmin.verifyIdToken(idToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired Google sign-in');
  }
  const email = decoded.email?.toLowerCase();
  if (!email || !decoded.email_verified) {
    throw ApiError.unauthorized('Google account has no verified email');
  }

  let user = await User.findOne({ email });
  if (user) {
    // Email verified by Google — safe to link onto an existing password
    // account the first time it signs in with Google.
    if (user.googleId !== decoded.uid) {
      user.googleId = decoded.uid;
      await user.save();
    }
  } else {
    const name = decoded.name || email.split('@')[0];
    const org = await Organization.create({ name: `${name}'s Organization` });
    user = await User.create({
      name,
      email,
      googleId: decoded.uid,
      organizationId: org._id,
      role: 'owner',
    });
    await Organization.updateOne({ _id: org._id }, { createdBy: user._id });
    await sendWelcomeEmail(user.email, user.name);
  }

  const tokens = await issueTokens(user);
  return { user: toUserDTO(user), tokens };
}

export async function refresh(refreshToken: string) {
  let payload: { userId: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }
  const user = await User.findById(payload.userId);
  // Plain string array (not the Mongoose DocumentArray) so the $set below
  // persists reliably.
  const hashes: string[] = [...((user?.refreshTokenHashes ?? []) as string[])];
  if (!user || hashes.length === 0) throw ApiError.unauthorized('Invalid refresh token');

  // Find which session this exact token belongs to (each stored fingerprint is
  // a distinct login). Exact match — no truncation.
  const idx = hashes.indexOf(fingerprintToken(refreshToken));
  if (idx === -1) throw ApiError.unauthorized('Invalid refresh token');

  // Rotate only THIS session's token, leaving other devices' sessions intact.
  const accessToken = signAccessToken({
    userId: String(user._id),
    organizationId: String(user.organizationId),
    role: user.role,
  });
  const newRefresh = signRefreshToken({ userId: String(user._id) });
  hashes[idx] = fingerprintToken(newRefresh);
  await User.updateOne({ _id: user._id }, { $set: { refreshTokenHashes: hashes } });
  return { tokens: { accessToken, refreshToken: newRefresh } };
}

export async function logout(userId: string) {
  // Clears all sessions for the user (the access-token-authenticated logout
  // route can't identify a single session). Signs the user out everywhere.
  await User.updateOne({ _id: userId }, { refreshTokenHashes: [] });
}

/**
 * Start a password reset: store a hashed, expiring 6-digit OTP and email it.
 * Always resolves silently so the endpoint can't be used to enumerate emails.
 */
export async function forgotPassword(email: string): Promise<void> {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return;
  const otp = randomInt(0, 1_000_000).toString().padStart(6, '0');
  user.resetOtpHash = await bcrypt.hash(otp, 10);
  user.resetOtpExpiresAt = new Date(Date.now() + RESET_OTP_TTL_MS);
  user.resetOtpAttempts = 0; // fresh code, fresh attempt budget
  await user.save();

  // Surface delivery failure to the operator (the endpoint still returns 204 to
  // preserve email-enumeration safety, but a silently-dropped reset email would
  // otherwise be invisible — a user "never gets the code" with no trace).
  const sent = await sendPasswordResetEmail(user.email, otp);
  if (!sent) {
    logger.error({ email: user.email }, 'Password-reset email failed to send');
  }
}

export async function resetPassword(
  email: string,
  otp: string,
  newPassword: string,
): Promise<void> {
  const invalid = () => ApiError.unauthorized('Invalid or expired reset code');
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user?.resetOtpHash || !user.resetOtpExpiresAt) throw invalid();
  if (user.resetOtpExpiresAt.getTime() < Date.now()) throw invalid();

  const ok = await bcrypt.compare(otp, user.resetOtpHash);
  if (!ok) {
    // Count wrong guesses and burn the code after too many, so a 6-digit OTP
    // can't be brute-forced within its 15-minute window (IP rate-limiting alone
    // is defeatable with rotating proxies).
    user.resetOtpAttempts = (user.resetOtpAttempts ?? 0) + 1;
    if (user.resetOtpAttempts >= MAX_RESET_ATTEMPTS) {
      user.resetOtpHash = null;
      user.resetOtpExpiresAt = null;
      user.resetOtpAttempts = 0;
    }
    await user.save();
    throw invalid();
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  // OTP is single-use; also invalidate every existing session.
  user.resetOtpHash = null;
  user.resetOtpExpiresAt = null;
  user.resetOtpAttempts = 0;
  user.refreshTokenHashes = [];
  await user.save();
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  if (!user.passwordHash) {
    throw ApiError.badRequest('This account signs in with Google and has no password to change');
  }
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('Current password is incorrect');
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  // Invalidate every session by clearing the stored refresh tokens.
  user.refreshTokenHashes = [];
  await user.save();
}

export async function me(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  const org = await Organization.findById(user.organizationId);
  return {
    user: toUserDTO(user),
    organization: org
      ? {
          id: String(org._id),
          name: org.name,
          billingStatus: org.billingStatus,
          paymentMethod: org.paymentMethod
            ? {
                cardType: org.paymentMethod.cardType ?? '',
                brand: org.paymentMethod.brand ?? '',
                last4: org.paymentMethod.last4 ?? '',
                addedAt: org.paymentMethod.addedAt?.toISOString() ?? '',
              }
            : undefined,
        }
      : null,
  };
}
