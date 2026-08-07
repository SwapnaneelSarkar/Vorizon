import express from 'express';
import pino from 'pino';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildHttpLogger } from '../src/middleware/httpLogger.js';
import { errorHandler } from '../src/middleware/error.js';
import { ApiError } from '../src/utils/apiError.js';
import { buildLoggerOptions, REDACT_PATHS } from '../src/utils/logger.js';

/** Capture pino output synchronously for assertions. */
function captureLogger() {
  const lines: Record<string, unknown>[] = [];
  const stream = { write: (chunk: string) => void lines.push(JSON.parse(chunk)) };
  const logger = pino({ level: 'info', redact: { paths: REDACT_PATHS, censor: '[REDACTED]' } }, stream);
  return { logger, lines };
}

function makeApp() {
  const { logger, lines } = captureLogger();
  const app = express();
  app.use(buildHttpLogger(logger));
  app.get('/ok', (_req, res) => res.json({ ok: true }));
  app.get('/boom', (_req, _res) => {
    throw ApiError.badRequest('Bad input');
  });
  app.get('/crash', (_req, _res) => {
    throw new Error('kaboom');
  });
  app.use(errorHandler);
  return { app, lines };
}

describe('backend logging', () => {
  it('never logs credentials: authorization/cookie headers are redacted, serializers are lean', async () => {
    const { app, lines } = makeApp();
    await request(app)
      .get('/ok')
      .set('Authorization', 'Bearer super-secret-jwt')
      .set('Cookie', 'session=secret')
      .expect(200);

    const line = lines.find((l) => (l.req as { url?: string })?.url === '/ok')!;
    const raw = JSON.stringify(line);
    expect(raw).not.toContain('super-secret-jwt');
    expect(raw).not.toContain('session=secret');
    // Lean serializer: only method/url/remoteAddress — no headers object at all.
    expect(Object.keys(line.req as object).sort()).toEqual(
      ['id', 'method', 'remoteAddress', 'url'].sort(),
    );
    expect((line.res as { statusCode: number }).statusCode).toBe(200);
  });

  it('assigns a request id, echoes it on the response, and honors inbound ids', async () => {
    const { app, lines } = makeApp();
    const res = await request(app).get('/ok').expect(200);
    expect(res.headers['x-request-id']).toMatch(/[\w-]{8,}/);
    const line = lines.find((l) => (l.req as { url?: string })?.url === '/ok')!;
    expect(line.reqId ?? (line.req as { id?: string }).id).toBeTruthy();

    const res2 = await request(app).get('/ok').set('X-Request-Id', 'trace-me-123').expect(200);
    expect(res2.headers['x-request-id']).toBe('trace-me-123');
  });

  it('maps outcome to level: 200→info, 4xx→warn, 5xx→error', async () => {
    const { app, lines } = makeApp();
    await request(app).get('/ok').expect(200);
    await request(app).get('/boom').expect(400);
    await request(app).get('/crash').expect(500);

    const byUrl = (u: string) =>
      lines.filter((l) => (l.req as { url?: string })?.url === u && l.res !== undefined);
    expect(byUrl('/ok')[0].level).toBe(30); // info
    expect(byUrl('/boom')[0].level).toBe(40); // warn
    expect(byUrl('/crash')[0].level).toBe(50); // error
  });

  it('error responses carry the requestId so users can report traceable failures', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/boom').expect(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
    expect(res.body.error.requestId).toBe(res.headers['x-request-id']);

    const crash = await request(app).get('/crash').expect(500);
    expect(crash.body.error.code).toBe('INTERNAL');
    expect(crash.body.error.message).toBe('Something went wrong'); // no internals leaked
    expect(crash.body.error.requestId).toBe(crash.headers['x-request-id']);
  });

  it('logs expected errors with context and unexpected errors with stacks', async () => {
    const { app, lines } = makeApp();
    await request(app).get('/boom').expect(400);
    await request(app).get('/crash').expect(500);

    const apiErrLine = lines.find((l) => l.code === 'BAD_REQUEST')!;
    expect(apiErrLine.level).toBe(40);
    expect(apiErrLine.path).toBe('/boom');
    expect(apiErrLine.requestId).toBeTruthy();

    const crashLine = lines.find(
      (l) => l.msg === 'Unhandled error' || (l as { message?: string }).message === 'Unhandled error',
    )!;
    expect(crashLine.level).toBe(50);
    expect(JSON.stringify(crashLine.err)).toContain('kaboom');
    expect(JSON.stringify(crashLine.err)).toContain('stack');
    // stack_trace is what GCP Error Reporting ingests from jsonPayload.
    expect(String(crashLine.stack_trace)).toContain('kaboom');
  });

  it('emits the Cloud Logging shape on GCP: severity, message key, RFC3339 time', () => {
    const lines: Record<string, unknown>[] = [];
    const stream = { write: (chunk: string) => void lines.push(JSON.parse(chunk)) };
    const gcpLogger = pino({ ...buildLoggerOptions(true), level: 'info' }, stream);

    gcpLogger.info('hello');
    gcpLogger.error('broken');

    const [info, error] = lines;
    expect(info.severity).toBe('INFO');
    expect(error.severity).toBe('ERROR');
    expect(info.level).toBeUndefined(); // severity replaces the numeric level
    expect(info.message).toBe('hello'); // message key, not msg
    // RFC3339 string — numeric epoch is not parsed by Cloud Logging.
    expect(typeof info.time).toBe('string');
    expect(info.time).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(info.revision).toBeTruthy();
  });

  it('keeps the local shape off GCP: numeric level, msg key', () => {
    const lines: Record<string, unknown>[] = [];
    const stream = { write: (chunk: string) => void lines.push(JSON.parse(chunk)) };
    const localLogger = pino({ ...buildLoggerOptions(false), level: 'info' }, stream);
    localLogger.warn('careful');
    expect(lines[0].level).toBe(40);
    expect(lines[0].msg).toBe('careful');
  });
});
