import pino, { type LoggerOptions } from 'pino';
import { env } from '../config/env.js';

/** Running on Cloud Functions / Cloud Run (K_SERVICE is injected by the runtime). */
const onGcp = Boolean(process.env.K_SERVICE);

/** Map pino levels onto Cloud Logging severities so errors surface as errors. */
const GCP_SEVERITY: Record<string, string> = {
  trace: 'DEBUG',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
  fatal: 'CRITICAL',
};

/**
 * Fields that must never reach logs. Applied to every logger (http + app).
 * Exported so tests can assert the policy.
 */
export const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-razorpay-signature"]',
  'req.headers["x-retell-signature"]',
  'res.headers["set-cookie"]',
  '*.password',
  '*.newPassword',
  '*.currentPassword',
  '*.passwordHash',
  '*.otp',
  '*.accessToken',
  '*.refreshToken',
  '*.secret',
  '*.apiKey',
];

/**
 * Logger options, parameterized on the runtime so tests can pin the GCP shape.
 * On GCP: `message` is the display field, `severity` drives Cloud Logging and
 * Error Reporting levels, and `time` must be RFC 3339 (numeric epoch is NOT
 * parsed — entries would be stamped with ingest time and misorder under gen2
 * CPU throttling). pid/hostname are per-instance noise there; the revision
 * label identifies the deployment instead.
 */
export function buildLoggerOptions(gcp: boolean = onGcp): LoggerOptions {
  return {
    level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
    redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
    ...(gcp
      ? {
          messageKey: 'message',
          timestamp: pino.stdTimeFunctions.isoTime,
          base: { revision: process.env.K_REVISION ?? 'unknown' },
          formatters: {
            level(label: string) {
              return { severity: GCP_SEVERITY[label] ?? 'INFO' };
            },
          },
        }
      : {}),
    transport:
      env.NODE_ENV === 'development' && !gcp
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
        : undefined,
  };
}

export const logger = pino(buildLoggerOptions());

/** Child logger tagged with the owning module, e.g. moduleLogger('payments'). */
export function moduleLogger(module: string) {
  return logger.child({ module });
}
