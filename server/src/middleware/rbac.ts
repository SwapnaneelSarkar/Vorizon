import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@vorizon/shared';
import { ApiError } from '../utils/apiError.js';

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient role'));
    }
    next();
  };
}
