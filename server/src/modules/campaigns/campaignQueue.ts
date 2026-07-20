import { isRedisEnabled } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import { runCampaign } from './campaignRunner.js';
import { BullCampaignQueue } from './bullQueue.js';

/**
 * Swappable queue boundary for campaign execution.
 * - REDIS_URL unset → in-process, non-blocking (fire-and-forget). Fine for a
 *   single instance; jobs are lost on restart.
 * - REDIS_URL set → durable BullMQ/Redis queue (see bullQueue.ts), processed by
 *   workers (see campaignWorker.ts). Survives restarts and scales horizontally.
 * The rest of the app calls campaignQueue.enqueue() and is unaware of which.
 */
export interface CampaignQueue {
  enqueue(orgId: string, campaignId: string): void;
  /** Test/CI helper: resolve when in-flight in-process jobs settle. */
  drain(): Promise<void>;
}

class InProcessCampaignQueue implements CampaignQueue {
  private inFlight = new Set<Promise<void>>();

  enqueue(orgId: string, campaignId: string): void {
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
  // BullCampaignQueue only opens a Redis connection in its constructor, so it is
  // instantiated exclusively when Redis is enabled.
  return isRedisEnabled ? new BullCampaignQueue() : new InProcessCampaignQueue();
}

export const campaignQueue: CampaignQueue = createQueue();
