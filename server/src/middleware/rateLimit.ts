import rateLimit, { type Options, type Store, type IncrementResponse } from 'express-rate-limit';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { env } from '../config/env.js';
import { getDb } from '../config/firebase.js';

const COLLECTION = 'rateLimits';

/** Doc IDs must not contain '/'; keys are client IPs, so encode defensively. */
function docId(prefix: string, key: string): string {
  return encodeURIComponent(prefix + key);
}

/**
 * express-rate-limit store backed by Firestore, so limits are shared across all
 * API instances. One doc per (prefix, client key) holding the hit count and the
 * window's reset time; expired windows restart on the next hit.
 */
class FirestoreStore implements Store {
  private windowMs = 60_000;

  constructor(
    private db: Firestore,
    private keyPrefix: string,
  ) {}

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<IncrementResponse> {
    const ref = this.db.collection(COLLECTION).doc(docId(this.keyPrefix, key));
    return this.db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const now = Date.now();
      const data = snap.data() as { totalHits: number; resetAt: number } | undefined;
      if (!data || data.resetAt <= now) {
        const resetAt = now + this.windowMs;
        tx.set(ref, { totalHits: 1, resetAt });
        return { totalHits: 1, resetTime: new Date(resetAt) };
      }
      tx.update(ref, { totalHits: FieldValue.increment(1) });
      return { totalHits: data.totalHits + 1, resetTime: new Date(data.resetAt) };
    });
  }

  async decrement(key: string): Promise<void> {
    const ref = this.db.collection(COLLECTION).doc(docId(this.keyPrefix, key));
    await ref.update({ totalHits: FieldValue.increment(-1) }).catch(() => undefined);
  }

  async resetKey(key: string): Promise<void> {
    await this.db.collection(COLLECTION).doc(docId(this.keyPrefix, key)).delete();
  }
}

/**
 * Build a rate limiter. Uses a Firestore store when Firebase is configured
 * (shared across all API instances); falls back to per-instance in-memory
 * otherwise. Always skipped in tests.
 */
export function makeRateLimiter(opts: Partial<Options> & { prefix?: string }): ReturnType<typeof rateLimit> {
  const { prefix, message, ...rest } = opts;
  const db = getDb();
  const body = (message as { error?: Record<string, unknown> } | undefined) ?? {
    error: { code: 'RATE_LIMITED', message: 'Too many requests' },
  };
  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    // Custom handler so 429s carry the requestId like every other error body.
    handler: (req, res) => {
      res
        .status(429)
        .json({ ...body, error: { ...body.error, requestId: (req as { id?: string }).id } });
    },
    ...(db ? { store: new FirestoreStore(db, prefix ?? 'rl:') } : {}),
    ...rest,
  });
}
