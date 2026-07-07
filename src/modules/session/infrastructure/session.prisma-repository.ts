import type { RefreshSession } from '@prisma/client';
import { prisma } from '../../../database/prisma.client.js';
import {
  RefreshSessionEntity as RefreshSessionModel,
  type RefreshSessionEntity,
} from '../domain/refresh-session.entity.js';
import type { CreateRefreshSessionInput, SessionRepository } from '../domain/session.repository.js';

function toDomain(record: RefreshSession): RefreshSessionEntity {
  return RefreshSessionModel.create({
    id: record.id,
    userId: record.userId,
    tokenHash: record.tokenHash,
    expiresAt: record.expiresAt,
    revokedAt: record.revokedAt,
    createdAt: record.createdAt,
  });
}

export class SessionPrismaRepository implements SessionRepository {
  async create(input: CreateRefreshSessionInput): Promise<RefreshSessionEntity> {
    return toDomain(await prisma.refreshSession.create({ data: input }));
  }

  async findById(sessionId: string): Promise<RefreshSessionEntity | null> {
    const record = await prisma.refreshSession.findUnique({ where: { id: sessionId } });
    return record ? toDomain(record) : null;
  }

  async revoke(sessionId: string): Promise<void> {
    await prisma.refreshSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }
}
