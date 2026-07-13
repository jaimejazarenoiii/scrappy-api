import type { ActivityLog } from '@prisma/client';
import { ActivityLogEntity } from '../../domain/activity-log.entity.js';

export function toActivityLogDomain(record: ActivityLog): ActivityLogEntity {
  const metadata =
    record.metadata && typeof record.metadata === 'object' && !Array.isArray(record.metadata)
      ? (record.metadata as Record<string, unknown>)
      : null;

  return ActivityLogEntity.create({
    id: record.id,
    companyId: record.companyId,
    eventType: record.eventType,
    module: record.module,
    action: record.action,
    description: record.description,
    userId: record.userId,
    employeeId: record.employeeId,
    resourceType: record.resourceType,
    resourceId: record.resourceId,
    resourceNumber: record.resourceNumber,
    ipAddress: record.ipAddress,
    userAgent: record.userAgent,
    metadata,
    createdAt: record.createdAt,
  });
}
