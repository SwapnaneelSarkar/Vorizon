import type { Server } from 'node:http';
import { createApp } from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function main() {
  await connectDb();
  const app = createApp();
  const server: Server = app.listen(env.PORT, () => {
    logger.info(`Vorizon API listening on http://localhost:${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down…');
    server.close();
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
