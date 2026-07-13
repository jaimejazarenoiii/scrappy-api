import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('activity log sort api', () => {
  it('sorts by module ascending', async () => {
    const { app, activityLogRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    activityLogRepository.seed({
      companyId: owner.companyId,
      userId: owner.userId,
      module: 'warehouse',
      action: 'warehouse.created',
    });
    activityLogRepository.seed({
      companyId: owner.companyId,
      userId: owner.userId,
      module: 'branch',
      action: 'branch.created',
    });

    const response = await request(app)
      .get('/api/v1/activity-logs?sortBy=module&sortOrder=asc&limit=50')
      .set(owner.auth);
    expect(response.status).toBe(200);
    const modules = response.body.data
      .map((row: { module: string }) => row.module)
      .filter((module: string) => module === 'branch' || module === 'warehouse');
    expect(modules).toEqual(['branch', 'warehouse']);
  });
});
