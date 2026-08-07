import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { apiRouter } from './router.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { buildHttpLogger } from './middleware/httpLogger.js';
import { makeRateLimiter } from './middleware/rateLimit.js';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(compression());
  // Expose X-Request-Id so the browser client can read the correlation id.
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(','),
      credentials: true,
      exposedHeaders: ['X-Request-Id'],
    }),
  );
  if (env.NODE_ENV !== 'test') {
    app.use(buildHttpLogger());
  }
  // Keep the raw body around for webhook signature verification (Razorpay, Retell).
  app.use(
    express.json({
      limit: '2mb',
      verify: (req, _res, buf) => {
        (req as express.Request).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Global API rate limit (per-IP). Auth routes add a stricter limiter on top.
  app.use(
    '/api',
    makeRateLimiter({
      windowMs: 60 * 1000,
      max: env.RATE_LIMIT_MAX,
      prefix: 'rl:global:',
      message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
    }),
  );

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
