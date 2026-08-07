import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

/**
 * Central error boundary. Every failure — expected or not — is logged with the
 * request id, path and user context, and the response carries the same
 * requestId so a user-reported error maps straight to its log lines.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req.id as string | undefined) ?? undefined;
  const log = req.log ?? logger;
  const ctx = {
    requestId,
    path: req.originalUrl,
    method: req.method,
    userId: req.user?.userId,
    organizationId: req.user?.organizationId,
  };

  if (err instanceof ZodError) {
    log.warn({ ...ctx, issues: err.flatten().fieldErrors }, 'Request validation failed');
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: err.flatten(), requestId },
    });
  }

  if (err instanceof ApiError) {
    // Expected domain errors: warn for client mistakes, error for server faults.
    const level = err.status >= 500 ? 'error' : 'warn';
    log[level]({ ...ctx, code: err.code, status: err.status, details: err.details }, err.message);
    return res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message, details: err.details, requestId } });
  }

  // Duplicate key (Mongo)
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    log.warn({ ...ctx, keyValue: (err as { keyValue?: unknown }).keyValue }, 'Duplicate key');
    return res
      .status(409)
      .json({ error: { code: 'DUPLICATE', message: 'Resource already exists', requestId } });
  }

  // Unexpected: full error with stack. Never leak internals to the client.
  // stack_trace is the field GCP Error Reporting ingests from jsonPayload —
  // without it, ERROR-severity lines never surface as tracked error events.
  log.error(
    { ...ctx, err, stack_trace: err instanceof Error ? err.stack : undefined },
    'Unhandled error',
  );
  return res
    .status(500)
    .json({ error: { code: 'INTERNAL', message: 'Something went wrong', requestId } });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      requestId: (req.id as string | undefined) ?? undefined,
    },
  });
}
