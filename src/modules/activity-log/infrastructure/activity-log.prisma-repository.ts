import { prisma } from '../../../database/prisma.client.js';
import type { Prisma } from '@prisma/client';
import type {
  ActivityLogRepository,
  AppendActivityLogInput,
  ListActivityLogsQuery,
  ListActivityLogsResult,
} from '../domain/activity-log.repository.js';
import type { ActivityLogEntity } from '../domain/activity-log.entity.js';
import { toActivityLogDomain } from './mappers/activity-log.mapper.js';

export class ActivityLogPrismaRepository implements ActivityLogRepository {
  async append(input: AppendActivityLogInput): Promise<ActivityLogEntity> {
    const record = await prisma.activityLog.create({
      data: {
        id: input.id,
        companyId: input.companyId,
        eventType: input.eventType,
        module: input.module,
        action: input.action,
        description: input.description,
        userId: input.userId,
        employeeId: input.employeeId ?? null,
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        resourceNumber: input.resourceNumber ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        createdAt: input.createdAt ?? new Date(),
      },
    });
    return toActivityLogDomain(record);
  }

  async findById(activityLogId: string, companyId: string): Promise<ActivityLogEntity | null> {
    const record = await prisma.activityLog.findFirst({
      where: { id: activityLogId, companyId },
    });
    return record ? toActivityLogDomain(record) : null;
  }

  async list(companyId: string, query: ListActivityLogsQuery): Promise<ListActivityLogsResult> {
    const where = buildWhere(companyId, query);
    const orderBy = buildOrderBy(query);
    const [total, records] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);
    return { total, items: records.map(toActivityLogDomain) };
  }
}

function buildWhere(companyId: string, query: ListActivityLogsQuery) {
  const where: Record<string, unknown> = { companyId };
  if (query.module) where.module = query.module;
  if (query.action) where.action = query.action;
  if (query.userId) where.userId = query.userId;
  if (query.eventType) where.eventType = query.eventType;
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {
      ...(query.dateFrom ? { gte: query.dateFrom } : {}),
      ...(query.dateTo ? { lte: query.dateTo } : {}),
    };
  }
  if (query.q && query.searchBy) {
    const q = query.q.trim();
    switch (query.searchBy) {
      case 'action':
        where.action = { contains: q, mode: 'insensitive' };
        break;
      case 'user':
        where.OR = [
          { userId: { equals: q } },
          { metadata: { path: ['actorEmail'], string_contains: q } },
        ];
        break;
      case 'employeeName':
        where.OR = [
          { resourceNumber: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { metadata: { path: ['employeeName'], string_contains: q } },
        ];
        break;
      case 'transactionNumber':
      case 'tripNumber':
      case 'expenseNumber':
        where.resourceNumber = { contains: q, mode: 'insensitive' };
        break;
      default:
        break;
    }
  }
  return where;
}

function buildOrderBy(query: ListActivityLogsQuery) {
  const dir = query.sortOrder;
  if (query.sortBy === 'module')
    return [{ module: dir }, { createdAt: 'desc' as const }, { id: 'desc' as const }];
  if (query.sortBy === 'user')
    return [{ userId: dir }, { createdAt: 'desc' as const }, { id: 'desc' as const }];
  return [{ createdAt: dir }, { id: 'desc' as const }];
}
