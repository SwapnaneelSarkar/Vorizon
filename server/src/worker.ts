/**
 * Standalone campaign worker process. Run dedicated workers for horizontal
 * scale: set WORKER_IN_PROCESS=false on the API and run `npm run worker` (one
 * or more instances). Requires REDIS_URL.
 */
import { connectDb, disconnectDb } from './config/db.js';
import { closeRedis, isRedisEnabled } from './config/redis.js';
import { startCampaignWorker, stopCampaignWorker } from './modules/campaigns/campaignWorker.js';
import { logger } from './utils/logger.js';

async function main() {
  if (!isRedisEnabled) {
    logger.error('REDIS_URL is required to run the campaign worker');
    process.exit(1);
  }
  await connectDb();
  startCampaignWorker();
  logger.info('Standalone campaign worker running');

  const shutdown = async () => {
    await stopCampaignWorker();
    await closeRedis();
    await disconnectDb();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

main().catch((err) => {
  logger.error({ err }, 'Worker failed to start');
  process.exit(1);
});
