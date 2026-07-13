import { describe, expect, it } from 'vitest';
import { ListActivityLogsUseCase } from '../../../src/modules/activity-log/application/use-cases/list-activity-logs.use-case.js';
import { GetActivityLogUseCase } from '../../../src/modules/activity-log/application/use-cases/get-activity-log.use-case.js';
import { ResourceNotFoundError } from '../../../src/shared/errors/http-exceptions.js';
import { InMemoryActivityLogRepository } from '../../setup/in-memory-activity-log-repository.js';

describe('list/get activity log use cases', () => {
  it('lists only company-scoped logs newest first by default', async () => {
    const repo = new InMemoryActivityLogRepository();
    const older = repo.seed({
      companyId: 'c1',
      userId: 'u1',
      action: 'auth.login',
      module: 'auth',
      eventType: 'AUTHENTICATION',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const newer = repo.seed({
      companyId: 'c1',
      userId: 'u1',
      action: 'employee.created',
      module: 'employee',
      eventType: 'EMPLOYEE',
      createdAt: new Date('2026-02-01T00:00:00.000Z'),
    });
    repo.seed({
      companyId: 'c2',
      userId: 'u2',
      action: 'auth.login',
      module: 'auth',
      eventType: 'AUTHENTICATION',
    });

    const result = await new ListActivityLogsUseCase(repo).execute(
      { companyId: 'c1', userId: 'u1', role: 'OWNER' },
      { page: 1, limit: 20, sortBy: 'createdAt', sortOrder: 'desc' },
    );

    expect(result.items).toHaveLength(2);
    expect(result.items[0]!.id).toBe(newer.id);
    expect(result.items[1]!.id).toBe(older.id);
    expect(result.meta.total).toBe(2);
  });

  it('returns 404 for cross-company get', async () => {
    const repo = new InMemoryActivityLogRepository();
    const seeded = repo.seed({ companyId: 'c1', userId: 'u1' });
    await expect(
      new GetActivityLogUseCase(repo).execute(seeded.id, {
        companyId: 'c2',
        userId: 'u2',
        role: 'OWNER',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
