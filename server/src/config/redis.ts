import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

/** Whether Redis-backed features (rate limiting, durable queue) are enabled. */
export const isRedisEnabled = Boolean(env.REDIS_URL);

let client: Redis | null = null;
const bullConnections: Redis[] = [];

/** Shared client for rate limiting and general use. Null when Redis is off. */
export function getRedis(): Redis | null {
  if (!env.REDIS_URL) return null;
  if (!client) {
    client = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 });
    client.on('error', (err) => logger.error({ err }, 'Redis error'));
    client.on('connect', () => logger.info('Redis connected'));
  }
  return client;
}

/**
 * Create a NEW dedicated connection for BullMQ. Queue and Worker must each own
 * their connection (workers issue blocking commands), so this returns a fresh
 * instance every call. All are tracked for graceful shutdown.
 */
export function createBullConnection(): Redis | null {
  if (!env.REDIS_URL) return null;
  const conn = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  conn.on('error', (err) => logger.error({ err }, 'Redis (queue) error'));
  bullConnections.push(conn);
  return conn;
}

export async function closeRedis(): Promise<void> {
  await Promise.allSettled([client?.quit(), ...bullConnections.map((c) => c.quit())]);
  client = null;
  bullConnections.length = 0;
}
