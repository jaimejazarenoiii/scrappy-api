import { PrismaClient } from '@prisma/client';

/**
 * Prisma client singleton for database access (infrastructure layer only).
 */
let prisma: PrismaClient | null = null;

/**
 * Returns the singleton Prisma client instance.
 * @returns PrismaClient instance
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

/**
 * Disconnects the Prisma client gracefully.
 */
export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

/**
 * Resets Prisma client — for testing only.
 */
export function resetPrismaForTests(): void {
  prisma = null;
}
