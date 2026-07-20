import { Worker } from 'bullmq';
import { createBullConnection } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import { CAMPAIGN_QUEUE_NAME } from './constants.js';
import { runCampaign } from './campaignRunner.js';

let worker: Worker | null = null;

/** Start a BullMQ worker that executes queued campaigns. No-op without Redis. */
export function startCampaignWorker(): void {
  if (worker) return;
  const connection = createBullConnection();
  if (!connection) return;

  worker = new Worker(
    CAMPAIGN_QUEUE_NAME,
    async (job) => {
      const { orgId, campaignId } = job.data as { orgId: string; campaignId: string };
      await runCampaign(orgId, campaignId);
    },
    { connection, concurrency: 3 },
  );

  worker.on('failed', (job, err) => logger.error({ err, jobId: job?.id }, 'Campaign job failed'));
  worker.on('completed', (job) => logger.info({ jobId: job.id }, 'Campaign job completed'));
  logger.info('Campaign worker started (BullMQ)');
}

export async function stopCampaignWorker(): Promise<void> {
  await worker?.close();
  worker = null;
}
