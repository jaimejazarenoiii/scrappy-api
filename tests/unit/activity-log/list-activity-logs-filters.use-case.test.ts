import { describe, expect, it } from 'vitest';
import { ListActivityLogsUseCase } from '../../../src/modules/activity-log/application/use-cases/list-activity-logs.use-case.js';
import { InMemoryActivityLogRepository } from '../../setup/in-memory-activity-log-repository.js';

describe('list activity log filters', () => {
  it('filters by module/action/user/eventType and searches resource numbers', async () => {
    const repo = new InMemoryActivityLogRepository();
    repo.seed({
      companyId: 'c1',
      userId: 'u1',
      module: 'transaction',
      action: 'transaction.created',
      eventType: 'TRANSACTION',
      resourceNumber: 'TRX-100',
      createdAt: new Date('2026-03-01T00:00:00.000Z'),
    });
    repo.seed({
      companyId: 'c1',
      userId: 'u2',
      module: 'employee',
      action: 'employee.created',
      eventType: 'EMPLOYEE',
      resourceNumber: 'Jane Worker',
      metadata: { employeeName: 'Jane Worker' },
      createdAt: new Date('2026-03-02T00:00:00.000Z'),
    });

    const filtered = await new ListActivityLogsUseCase(repo).execute(
      { companyId: 'c1', userId: 'u1', role: 'OWNER' },
      {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        module: 'transaction',
        action: 'transaction.created',
        userId: 'u1',
        eventType: 'TRANSACTION',
      },
    );
    expect(filtered.items).toHaveLength(1);
    expect(filtered.items[0]!.resourceNumber).toBe('TRX-100');

    const searched = await new ListActivityLogsUseCase(repo).execute(
      { companyId: 'c1', userId: 'u1', role: 'OWNER' },
      {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        q: 'Jane',
        searchBy: 'employeeName',
      },
    );
    expect(searched.items).toHaveLength(1);
    expect(searched.items[0]!.action).toBe('Seeded activity');
  });
});
