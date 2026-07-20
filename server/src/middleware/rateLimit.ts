import rateLimit, { type Options } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { env } from '../config/env.js';
import { getRedis } from '../config/redis.js';

/**
 * Build a rate limiter. Uses a Redis store when REDIS_URL is set (shared across
 * all API instances); falls back to per-instance in-memory otherwise. Always
 * skipped in tests.
 */
export function makeRateLimiter(opts: Partial<Options> & { prefix?: string }): ReturnType<typeof rateLimit> {
  const { prefix, ...rest } = opts;
  const client = getRedis();
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    ...(client
      ? {
          store: new RedisStore({
            prefix: prefix ?? 'rl:',
            sendCommand: (...args: string[]) => client.call(...(args as [string, ...string[]])) as Promise<never>,
          }),
        }
      : {}),
    ...rest,
  });
}
