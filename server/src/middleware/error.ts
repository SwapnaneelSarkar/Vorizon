import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: err.flatten() },
    });
  }

  if (err instanceof ApiError) {
    return res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message, details: err.details } });
  }

  // Duplicate key (Mongo)
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    return res
      .status(409)
      .json({ error: { code: 'DUPLICATE', message: 'Resource already exists' } });
  }

  logger.error({ err }, 'Unhandled error');
  return res
    .status(500)
    .json({ error: { code: 'INTERNAL', message: 'Something went wrong' } });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
}
