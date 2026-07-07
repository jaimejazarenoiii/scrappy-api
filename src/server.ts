import 'dotenv/config';
import { createServer, type Server } from 'node:http';
import { loadConfig } from './infrastructure/config/index.js';
import { disconnectPrisma } from './infrastructure/database/prisma/client.js';
import { getLogger } from './infrastructure/logger/pino.logger.js';
import { createContainer } from './infrastructure/providers/container.js';
import { createApp } from './app.js';

/**
 * Boots the HTTP server with graceful shutdown handling.
 */
async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const logger = getLogger();
  const container = createContainer();
  const app = createApp(container);
  const server: Server = createServer(app);

  server.listen(config.PORT, () => {
    logger.info({ port: config.PORT, env: config.NODE_ENV }, 'Scrappy API started');
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down');
    server.close(async () => {
      await disconnectPrisma();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : 'Unknown startup error';
  console.error(`Failed to start application: ${message}`);
  process.exit(1);
});
