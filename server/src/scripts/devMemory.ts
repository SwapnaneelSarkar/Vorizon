/**
 * Boot the real HTTP server against an ephemeral in-memory MongoDB.
 * For local smoke-testing without Docker: `tsx src/scripts/devMemory.ts`.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { closeFirebase, isFirebaseEnabled } from '../config/firebase.js';
import { startCampaignWorker, stopCampaignWorker } from '../modules/campaigns/campaignWorker.js';
import { logger } from '../utils/logger.js';

async function main() {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  logger.info('In-memory MongoDB ready');

  if (isFirebaseEnabled && env.WORKER_IN_PROCESS) {
    startCampaignWorker();
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`Vorizon API (memory mode) on http://localhost:${env.PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await stopCampaignWorker();
    await closeFirebase();
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  logger.error({ err }, 'devMemory failed');
  process.exit(1);
});
