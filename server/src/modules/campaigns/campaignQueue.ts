import { logger } from '../../utils/logger.js';
import { runCampaign } from './campaignRunner.js';

/**
 * Swappable queue boundary for campaign execution. Phase 1 = in-process,
 * non-blocking (fire-and-forget) so the launch request returns immediately.
 * Swap this single file for a BullMQ/Redis-backed queue for durability and
 * horizontal scaling — the rest of the app is unchanged.
 */
export interface CampaignQueue {
  enqueue(orgId: string, campaignId: string): void;
  /** Test/CI helper: resolve when in-flight jobs settle. */
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

export const campaignQueue: CampaignQueue = new InProcessCampaignQueue();
