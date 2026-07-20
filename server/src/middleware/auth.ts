import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/apiError.js';
import { verifyAccessToken } from '../modules/auth/tokens.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing bearer token'));
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = {
      userId: payload.userId,
      organizationId: payload.organizationId,
      role: payload.role,
    };
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
}
