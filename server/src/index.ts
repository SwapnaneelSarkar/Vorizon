import type { Server } from 'node:http';
import { createApp } from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import { env } from './config/env.js';
import { closeFirebase, isFirebaseEnabled } from './config/firebase.js';
import { startCampaignWorker, stopCampaignWorker } from './modules/campaigns/campaignWorker.js';
import { logBootDiagnostics } from './utils/diagnostics.js';
import { logger } from './utils/logger.js';

async function main() {
  logBootDiagnostics('server');
  await connectDb();

  // With Firebase enabled, optionally run the campaign worker in-process (single
  // instance). For horizontal scale, set WORKER_IN_PROCESS=false and run
  // dedicated workers via `npm run worker`.
  if (isFirebaseEnabled && env.WORKER_IN_PROCESS) {
    startCampaignWorker();
  }

  const app = createApp();
  const server: Server = app.listen(env.PORT, () => {
    logger.info(`Vorizon API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down…');
    server.close();
    await stopCampaignWorker();
    await closeFirebase();
    await disconnectDb();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
