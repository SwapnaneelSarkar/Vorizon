import bcrypt from 'bcryptjs';
import type { AuthResponse, LoginInput, RegisterInput, UserDTO } from '@vorizon/shared';
import { Organization } from '../../models/Organization.js';
import { User, type UserDoc } from '../../models/User.js';
import { ApiError } from '../../utils/apiError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from './tokens.js';

type UserRecord = UserDoc & { _id: unknown };

function toUserDTO(user: UserRecord): UserDTO {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: String(user.organizationId),
  };
}

async function issueTokens(user: UserRecord) {
  const accessToken = signAccessToken({
    userId: String(user._id),
    organizationId: String(user.organizationId),
    role: user.role,
  });
  const refreshToken = signRefreshToken({ userId: String(user._id) });
  await User.updateOne(
    { _id: user._id },
    { refreshTokenHash: await bcrypt.hash(refreshToken, 10) },
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

  const tokens = await issueTokens(user);
  return { user: toUserDTO(user), tokens };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await User.findOne({ email: input.email.toLowerCase() });
  if (!user) throw ApiError.unauthorized('Invalid credentials');
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('Invalid credentials');

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
  if (!user || !user.refreshTokenHash) throw ApiError.unauthorized('Invalid refresh token');
  const match = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!match) throw ApiError.unauthorized('Invalid refresh token');

  const tokens = await issueTokens(user);
  return { tokens };
}

export async function logout(userId: string) {
  await User.updateOne({ _id: userId }, { refreshTokenHash: null });
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('Current password is incorrect');
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  // Invalidate other sessions by clearing the stored refresh token.
  user.refreshTokenHash = null;
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
