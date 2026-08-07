import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Request } from 'express';
import { pinoHttp, type HttpLogger } from 'pino-http';
import type pino from 'pino';
import { logger } from '../utils/logger.js';

/**
 * Request logging with debugging built in:
 * - Every request gets an id (honoring an inbound X-Request-Id) that is echoed
 *   on the response and attached to every log line and error payload, so a
 *   user-reported failure can be traced straight to its logs.
 * - Lean serializers: method/url/status/duration + authenticated user/org.
 *   Full headers are never logged (bearer tokens leaked with the defaults).
 * - Log level tracks the outcome: 5xx → error, 4xx → warn, else info.
 * - Health probes are ignored to keep production logs signal-dense.
 */
export function buildHttpLogger(base: pino.Logger = logger): HttpLogger {
  return pinoHttp({
    logger: base,
    genReqId: (req: IncomingMessage, res: ServerResponse) => {
      const inbound = req.headers['x-request-id'];
      const id =
        typeof inbound === 'string' && /^[\w.-]{1,64}$/.test(inbound) ? inbound : randomUUID();
      res.setHeader('X-Request-Id', id);
      return id;
    },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customSuccessMessage: (req, res, responseTime) =>
      `${req.method} ${req.url} → ${res.statusCode} (${responseTime}ms)`,
    customErrorMessage: (req, res) => `${req.method} ${req.url} → ${res.statusCode}`,
    customProps: (req) => {
      const user = (req as Request).user;
      return user ? { userId: user.userId, organizationId: user.organizationId } : {};
    },
    serializers: {
      req: (req: {
        id?: string;
        method?: string;
        url?: string;
        remoteAddress?: string;
        raw?: { ip?: string };
      }) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        // Real client address (via trust proxy); remoteAddress is the LB/socket peer.
        ip: req.raw?.ip ?? req.remoteAddress,
        remoteAddress: req.remoteAddress,
      }),
      res: (res: { statusCode?: number }) => ({ statusCode: res.statusCode }),
    },
    autoLogging: {
      ignore: (req) => req.url === '/api/health' || req.url === '/api/ready',
    },
  });
}
