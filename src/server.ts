import 'dotenv/config';
import { createServer, type Server } from 'node:http';
import { loadConfig } from './config/index.js';
import { getLogger } from './config/logger.js';
import { prisma } from './database/prisma.client.js';
import { createContainer } from './config/container.js';
import { createApp } from './app.js';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const app = createApp(createContainer());
  const logger = getLogger();
  const server: Server = createServer(app);
  server.listen(config.PORT, () => logger.info({ port: config.PORT }, 'Scrappy API started'));
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down');
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((error: unknown) => {
  const logger = getLogger();
  logger.error({ error }, 'Failed to start server');
  process.exit(1);
});
