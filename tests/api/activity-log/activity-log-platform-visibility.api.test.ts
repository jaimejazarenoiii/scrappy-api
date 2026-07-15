import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('activity log platform visibility api', () => {
  it('excludes platform admin actions from tenant activity logs', async () => {
    const { app, activityLogRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    const tenantLog = activityLogRepository.seed({
      companyId: owner.companyId,
      userId: owner.userId,
      module: 'transaction',
      action: 'transaction.settled',
      eventType: 'TRANSACTION',
      description: 'Transaction paid',
    });
    const platformLog = activityLogRepository.seed({
      companyId: owner.companyId,
      userId: 'super-admin-user',
      module: 'employee',
      action: 'admin.account_created',
      eventType: 'EMPLOYEE',
      description: 'Account provisioned by platform admin',
    });
    activityLogRepository.superAdminUserIds.add('super-admin-user');

    const list = await request(app).get('/api/v1/activity-logs').set(owner.auth);
    expect(list.status).toBe(200);
    expect(list.body.data.some((row: { id: string }) => row.id === tenantLog.id)).toBe(true);
    expect(list.body.data.some((row: { id: string }) => row.id === platformLog.id)).toBe(false);

    const hidden = await request(app)
      .get(`/api/v1/activity-logs/${platformLog.id}`)
      .set(owner.auth);
    expect(hidden.status).toBe(404);
  });
});
