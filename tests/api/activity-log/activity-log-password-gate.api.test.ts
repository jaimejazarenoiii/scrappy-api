import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('activity log password-change gate smoke', () => {
  it('allows owners to list activity logs when passwordChangeRequired is false', async () => {
    const { app, activityLogRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    activityLogRepository.seed({
      companyId: owner.companyId,
      userId: owner.userId,
      action: 'auth.login',
      module: 'auth',
      eventType: 'AUTHENTICATION',
    });

    const response = await request(app).get('/api/v1/activity-logs').set(owner.auth);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
