import type { HealthIndicator } from '../../application/interfaces/health-check.interface.js';
import { getPrismaClient } from '../database/prisma/client.js';

/**
 * Prisma-based health indicator that verifies PostgreSQL connectivity.
 */
export class PrismaHealthIndicator implements HealthIndicator {
  /**
   * Executes SELECT 1 against the database.
   * @returns True when the database is reachable
   */
  async check(): Promise<boolean> {
    try {
      const prisma = getPrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
