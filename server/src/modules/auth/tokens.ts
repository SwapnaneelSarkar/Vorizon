import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Role } from '@vorizon/shared';
import { env } from '../../config/env.js';

export interface AccessPayload {
  userId: string;
  organizationId: string;
  role: Role;
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
  } as jwt.SignOptions);
}

export function signRefreshToken(payload: { userId: string }): string {
  // A random jti makes each issued refresh token unique even for the same user
  // in the same second, so concurrent sessions (devices/tabs) are genuinely
  // distinct and rotating one never validates against another.
  return jwt.sign({ ...payload, jti: randomUUID() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };
}
