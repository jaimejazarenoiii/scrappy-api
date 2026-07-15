import { describe, expect, it } from 'vitest';
import { ListActivityLogsUseCase } from '../../../src/modules/activity-log/application/use-cases/list-activity-logs.use-case.js';
import { InMemoryActivityLogRepository } from '../../setup/in-memory-activity-log-repository.js';

describe('list activity log sort', () => {
  it('sorts by module ascending with createdAt tie-break', async () => {
    const repo = new InMemoryActivityLogRepository();
    repo.seed({
      companyId: 'c1',
      userId: 'u1',
      module: 'vehicle',
      action: 'vehicle.created',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    repo.seed({
      companyId: 'c1',
      userId: 'u1',
      module: 'branch',
      action: 'branch.created',
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    const result = await new ListActivityLogsUseCase(repo).execute(
      { companyId: 'c1', userId: 'u1', role: 'OWNER' },
      { page: 1, limit: 20, sortBy: 'module', sortOrder: 'asc' },
    );

    expect(result.items.map((item) => item.module)).toEqual(['Branch', 'Vehicle']);
  });
});
