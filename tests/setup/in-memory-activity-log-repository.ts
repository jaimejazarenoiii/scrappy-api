import { randomUUID } from 'node:crypto';
import { ActivityLogEntity } from '../../src/modules/activity-log/domain/activity-log.entity.js';
import type {
  ActivityLogRepository,
  AppendActivityLogInput,
  ListActivityLogsQuery,
  ListActivityLogsResult,
} from '../../src/modules/activity-log/domain/activity-log.repository.js';

export class InMemoryActivityLogRepository implements ActivityLogRepository {
  readonly items: ActivityLogEntity[] = [];

  async append(input: AppendActivityLogInput): Promise<ActivityLogEntity> {
    const entity = ActivityLogEntity.create({
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
      metadata: input.metadata ?? null,
      createdAt: input.createdAt ?? new Date(),
    });
    this.items.push(entity);
    return entity;
  }

  async findById(activityLogId: string, companyId: string): Promise<ActivityLogEntity | null> {
    return (
      this.items.find((item) => item.id === activityLogId && item.companyId === companyId) ?? null
    );
  }

  async list(companyId: string, query: ListActivityLogsQuery): Promise<ListActivityLogsResult> {
    let filtered = this.items.filter((item) => item.companyId === companyId);

    if (query.module) filtered = filtered.filter((item) => item.module === query.module);
    if (query.action) filtered = filtered.filter((item) => item.action === query.action);
    if (query.userId) filtered = filtered.filter((item) => item.userId === query.userId);
    if (query.eventType) filtered = filtered.filter((item) => item.eventType === query.eventType);
    if (query.dateFrom) {
      filtered = filtered.filter((item) => item.createdAt >= query.dateFrom!);
    }
    if (query.dateTo) {
      filtered = filtered.filter((item) => item.createdAt <= query.dateTo!);
    }

    if (query.q && query.searchBy) {
      const q = query.q.trim().toLowerCase();
      filtered = filtered.filter((item) => {
        switch (query.searchBy) {
          case 'action':
            return item.action.toLowerCase().includes(q);
          case 'user':
            return (
              item.userId.toLowerCase() === q ||
              String(item.metadata?.actorEmail ?? '')
                .toLowerCase()
                .includes(q)
            );
          case 'employeeName':
            return (
              (item.resourceNumber ?? '').toLowerCase().includes(q) ||
              item.description.toLowerCase().includes(q) ||
              String(item.metadata?.employeeName ?? '')
                .toLowerCase()
                .includes(q)
            );
          case 'transactionNumber':
          case 'tripNumber':
          case 'expenseNumber':
            return (item.resourceNumber ?? '').toLowerCase().includes(q);
          default:
            return true;
        }
      });
    }

    filtered = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (query.sortBy === 'module') cmp = a.module.localeCompare(b.module);
      else if (query.sortBy === 'user') cmp = a.userId.localeCompare(b.userId);
      else cmp = a.createdAt.getTime() - b.createdAt.getTime();
      if (cmp === 0) cmp = a.id.localeCompare(b.id);
      return query.sortOrder === 'asc' ? cmp : -cmp;
    });

    const total = filtered.length;
    const start = (query.page - 1) * query.limit;
    return { total, items: filtered.slice(start, start + query.limit) };
  }

  seed(partial: Partial<AppendActivityLogInput> & { companyId: string; userId: string }) {
    const entity = ActivityLogEntity.create({
      id: partial.id ?? randomUUID(),
      companyId: partial.companyId,
      eventType: partial.eventType ?? 'COMPANY',
      module: partial.module ?? 'company',
      action: partial.action ?? 'company.updated',
      description: partial.description ?? 'Seeded activity',
      userId: partial.userId,
      employeeId: partial.employeeId ?? null,
      resourceType: partial.resourceType ?? null,
      resourceId: partial.resourceId ?? null,
      resourceNumber: partial.resourceNumber ?? null,
      ipAddress: partial.ipAddress ?? null,
      userAgent: partial.userAgent ?? null,
      metadata: partial.metadata ?? null,
      createdAt: partial.createdAt ?? new Date(),
    });
    this.items.push(entity);
    return entity;
  }
}
