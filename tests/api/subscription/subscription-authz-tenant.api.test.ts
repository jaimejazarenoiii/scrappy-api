import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext } from '../../setup/test-app.js';
import { createCompanyAndLogin, createManagerUser } from '../../setup/auth-helpers.js';
import { createSuperAdminUser, loginAsSuperAdmin } from '../../setup/subscription-helpers.js';

describe('subscription authz and tenant isolation', () => {
  it('returns 403 for owner, manager on admin routes', async () => {
    const { app, userRepository } = createTestContext();
    const { companyId, auth } = await createCompanyAndLogin(app);
    const { auth: managerAuth } = await createManagerUser(app, userRepository, companyId);

    for (const headers of [auth, managerAuth]) {
      const res = await request(app)
        .get(`/api/v1/admin/companies/${companyId}/subscriptions`)
        .set(headers);
      expect(res.status).toBe(403);
    }
  });

  it('allows SUPER_ADMIN on any companyId path', async () => {
    const { app, userRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    await createSuperAdminUser(userRepository, companyId);
    const adminAuth = await loginAsSuperAdmin(app);

    const res = await request(app)
      .get(`/api/v1/admin/companies/${companyId}/subscription-status`)
      .set(adminAuth);
    expect(res.status).toBe(200);
  });
});
