import type { PrismaClient } from '@prisma/client';
import { prisma } from './prisma.client.js';

export async function withTransaction<T>(callback: (tx: PrismaClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => callback(tx as PrismaClient));
}
