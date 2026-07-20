import { Queue } from 'bullmq';
import { createBullConnection } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import { CAMPAIGN_QUEUE_NAME } from './constants.js';
import type { CampaignQueue } from './campaignQueue.js';

/**
 * Durable, distributed campaign queue backed by BullMQ + Redis. Jobs survive
 * restarts and can be processed by any number of worker processes. Selected
 * automatically when REDIS_URL is set.
 */
export class BullCampaignQueue implements CampaignQueue {
  private queue: Queue;

  constructor() {
    const connection = createBullConnection();
    if (!connection) throw new Error('BullCampaignQueue requires REDIS_URL');
    this.queue = new Queue(CAMPAIGN_QUEUE_NAME, { connection });
    logger.info('Campaign queue backed by BullMQ/Redis');
  }

  enqueue(orgId: string, campaignId: string): void {
    void this.queue
      .add(
        'run',
        { orgId, campaignId },
        { jobId: `campaign-${campaignId}`, removeOnComplete: true, removeOnFail: 100 },
      )
      .catch((err) => logger.error({ err, campaignId }, 'Failed to enqueue campaign job'));
  }

  async drain(): Promise<void> {
    // Durable queue is drained by workers; nothing to await in-process.
  }
}
