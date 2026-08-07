import { getDb } from '../../config/firebase.js';
import { logger } from '../../utils/logger.js';
import { CAMPAIGN_QUEUE_COLLECTION } from './constants.js';
import { NEVER, jobRef, type CampaignJob } from './firestoreQueue.js';
import { runCampaign } from './campaignRunner.js';

const CONCURRENCY = 3;
const POLL_MS = 5_000;
/** Lease per attempt; a worker that dies mid-run loses the lease and the job is retried. */
const LEASE_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 30_000;

let timer: NodeJS.Timeout | null = null;
const active = new Set<Promise<void>>();

/**
 * Atomically claim a job: bump attempts and push availableAt into the future
 * (the lease). Returns null if another worker claimed it first.
 */
async function claim(campaignId: string): Promise<CampaignJob | null> {
  const db = getDb()!;
  const ref = jobRef(campaignId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const job = snap.data() as CampaignJob | undefined;
    if (!job || job.availableAt > Date.now()) return null;
    const claimed: CampaignJob = { ...job, attempts: job.attempts + 1, availableAt: Date.now() + LEASE_MS };
    tx.set(ref, claimed);
    return claimed;
  });
}

async function execute(job: CampaignJob): Promise<void> {
  const ref = jobRef(job.campaignId);
  try {
    await runCampaign(job.orgId, job.campaignId);
    await ref.delete();
    logger.info({ campaignId: job.campaignId }, 'Campaign job completed');
  } catch (err) {
    logger.error({ err, campaignId: job.campaignId, attempt: job.attempts }, 'Campaign job failed');
    const update: Partial<CampaignJob> =
      job.attempts >= MAX_ATTEMPTS
        ? { availableAt: NEVER, failedAt: Date.now() }
        : { availableAt: Date.now() + RETRY_BACKOFF_MS * job.attempts };
    await ref.set({ ...job, ...update }).catch(() => undefined);
  }
}

async function poll(): Promise<void> {
  const db = getDb()!;
  const slots = CONCURRENCY - active.size;
  if (slots <= 0) return;
  // Claimable = availableAt in the past: queued, retry-due, or expired-lease jobs.
  const snap = await db
    .collection(CAMPAIGN_QUEUE_COLLECTION)
    .where('availableAt', '<=', Date.now())
    .limit(slots)
    .get();
  for (const doc of snap.docs) {
    const claimed = await claim((doc.data() as CampaignJob).campaignId);
    if (!claimed) continue;
    const task = execute(claimed).finally(() => active.delete(task));
    active.add(task);
  }
}

/**
 * Drain all currently-due jobs, bounded by a wall-clock budget. Used by the
 * serverless scheduled worker (Cloud Functions), where no resident polling
 * loop exists. Jobs leased by other workers are skipped automatically.
 */
export async function drainDueJobs(maxMs = 60_000): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  const deadline = Date.now() + maxMs;
  let processed = 0;
  while (Date.now() < deadline) {
    const snap = await db
      .collection(CAMPAIGN_QUEUE_COLLECTION)
      .where('availableAt', '<=', Date.now())
      .limit(CONCURRENCY)
      .get();
    if (snap.empty) break;
    const claimed = (
      await Promise.all(snap.docs.map((d) => claim((d.data() as CampaignJob).campaignId)))
    ).filter((j): j is CampaignJob => j !== null);
    await Promise.allSettled(claimed.map((j) => execute(j)));
    processed += claimed.length;
  }
  return processed;
}

/** Start the Firestore-polling campaign worker. No-op without Firebase. */
export function startCampaignWorker(): void {
  if (timer || !getDb()) return;
  timer = setInterval(() => {
    void poll().catch((err) => logger.error({ err }, 'Campaign worker poll failed'));
  }, POLL_MS);
  timer.unref();
  logger.info('Campaign worker started (Firestore queue)');
}

export async function stopCampaignWorker(): Promise<void> {
  if (timer) clearInterval(timer);
  timer = null;
  await Promise.allSettled([...active]);
}
