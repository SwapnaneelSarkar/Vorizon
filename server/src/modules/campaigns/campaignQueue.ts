import { isFirebaseEnabled } from '../../config/firebase.js';
import { logger } from '../../utils/logger.js';
import { runCampaign } from './campaignRunner.js';
import { FirestoreCampaignQueue } from './firestoreQueue.js';

/**
 * Swappable queue boundary for campaign execution.
 * - Firebase unset → in-process, non-blocking (fire-and-forget). Fine for a
 *   single instance; jobs are lost on restart.
 * - Firebase set → durable Firestore queue (see firestoreQueue.ts), processed
 *   by workers (see campaignWorker.ts). Survives restarts and scales
 *   horizontally. The rest of the app calls campaignQueue.enqueue() and is
 *   unaware of which.
 */
export interface CampaignQueue {
  /**
   * Persist/start the job. MUST be awaited by callers: on serverless runtimes
   * the instance freezes once the response is sent, so a fire-and-forget
   * enqueue would silently never commit.
   */
  enqueue(orgId: string, campaignId: string): Promise<void>;
  /** Test/CI helper: resolve when in-flight in-process jobs settle. */
  drain(): Promise<void>;
}

class InProcessCampaignQueue implements CampaignQueue {
  private inFlight = new Set<Promise<void>>();

  async enqueue(orgId: string, campaignId: string): Promise<void> {
    // Intentionally does not await the run itself — only its scheduling.
    const job = runCampaign(orgId, campaignId)
      .catch((err) => logger.error({ err, campaignId }, 'Campaign run failed'))
      .finally(() => this.inFlight.delete(job));
    this.inFlight.add(job);
  }

  async drain(): Promise<void> {
    await Promise.all([...this.inFlight]);
  }
}

function createQueue(): CampaignQueue {
  // FirestoreCampaignQueue only touches Firestore in its constructor, so it is
  // instantiated exclusively when Firebase is configured.
  return isFirebaseEnabled ? new FirestoreCampaignQueue() : new InProcessCampaignQueue();
}

export const campaignQueue: CampaignQueue = createQueue();
