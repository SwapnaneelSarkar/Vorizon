import { getDb } from '../../config/firebase.js';
import { logger } from '../../utils/logger.js';
import { CAMPAIGN_QUEUE_COLLECTION } from './constants.js';

export interface CampaignJob {
  orgId: string;
  campaignId: string;
  attempts: number;
  /** Epoch ms when the job may (again) be claimed — doubles as the lease/visibility timeout. */
  availableAt: number;
  createdAt: number;
  failedAt?: number;
}

/** Sentinel availableAt for permanently failed jobs, so pollers never match them. */
export const NEVER = 8_640_000_000_000_000; // max JS Date value

export function jobRef(campaignId: string) {
  const db = getDb();
  if (!db) throw new Error('Firestore campaign queue requires Firebase to be configured');
  return db.collection(CAMPAIGN_QUEUE_COLLECTION).doc(`campaign-${campaignId}`);
}

/**
 * Durable, distributed campaign queue backed by Firestore. Jobs survive
 * restarts and can be processed by any number of worker processes (see
 * campaignWorker.ts). Selected automatically when Firebase is configured.
 */
export class FirestoreCampaignQueue {
  constructor() {
    // Fail fast if Firebase is missing rather than on first enqueue.
    if (!getDb()) throw new Error('FirestoreCampaignQueue requires Firebase to be configured');
    logger.info('Campaign queue backed by Firestore');
  }

  async enqueue(orgId: string, campaignId: string): Promise<void> {
    const db = getDb()!;
    const ref = jobRef(campaignId);
    // Awaited to completion: on serverless the instance freezes after the
    // response, so the transaction must commit inside the request.
    try {
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const existing = snap.data() as CampaignJob | undefined;
        // Dedupe: a live (queued or leased) job for this campaign already exists.
        if (existing && !existing.failedAt) return;
        const now = Date.now();
        const job: CampaignJob = { orgId, campaignId, attempts: 0, availableAt: now, createdAt: now };
        tx.set(ref, job);
      });
    } catch (err) {
      logger.error({ err, campaignId }, 'Failed to enqueue campaign job');
      throw err;
    }
  }

  async drain(): Promise<void> {
    // Durable queue is drained by workers; nothing to await in-process.
  }
}
