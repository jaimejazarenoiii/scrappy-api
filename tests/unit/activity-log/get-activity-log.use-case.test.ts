import { describe, expect, it } from 'vitest';
import { GetActivityLogUseCase } from '../../../src/modules/activity-log/application/use-cases/get-activity-log.use-case.js';
import { InMemoryActivityLogRepository } from '../../setup/in-memory-activity-log-repository.js';

describe('GetActivityLogUseCase', () => {
  it('returns activity log for same company', async () => {
    const repo = new InMemoryActivityLogRepository();
    const seeded = repo.seed({
      companyId: 'c1',
      userId: 'u1',
      action: 'company.updated',
      description: 'Company updated',
    });
    const result = await new GetActivityLogUseCase(repo).execute(seeded.id, {
      companyId: 'c1',
      userId: 'u1',
      role: 'MANAGER',
    });
    expect(result.id).toBe(seeded.id);
    expect(result.action).toBe('Company updated');
  });
});
