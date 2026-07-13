import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext } from '../../setup/test-app.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createSuperAdminUser, loginAsSuperAdmin } from '../../setup/subscription-helpers.js';

describe('admin analytics API', () => {
  it('returns overview across companies and company-scoped drill-down', async () => {
    const { app, userRepository } = createTestContext();
    const first = await createCompanyAndLogin(app);
    await createSuperAdminUser(userRepository, first.companyId);
    const adminAuth = await loginAsSuperAdmin(app);

    const second = await request(app)
      .post('/api/v1/admin/companies')
      .set(adminAuth)
      .send({ name: 'Second Supervised Co' });
    expect(second.status).toBe(201);
    const secondId = second.body.data.id as string;

    const overview = await request(app)
      .get('/api/v1/admin/analytics/overview')
      .set(adminAuth)
      .query({ period: 'THIS_MONTH' });
    expect(overview.status).toBe(200);
    expect(overview.body.data.items.length).toBeGreaterThanOrEqual(2);
    expect(
      overview.body.data.items.some((row: { companyId: string }) => row.companyId === secondId),
    ).toBe(true);

    const companyMetrics = await request(app)
      .get(`/api/v1/admin/analytics/companies/${secondId}/company`)
      .set(adminAuth)
      .query({ period: 'THIS_MONTH' });
    expect(companyMetrics.status).toBe(200);
    expect(companyMetrics.body.data).toHaveProperty('totalInboundTransactions');

    for (const segment of [
      'transactions',
      'trips',
      'expenses',
      'workforce',
      'organization',
    ] as const) {
      const res = await request(app)
        .get(`/api/v1/admin/analytics/companies/${secondId}/${segment}`)
        .set(adminAuth)
        .query({ period: 'THIS_MONTH' });
      expect(res.status).toBe(200);
    }
  });

  it('blocks SUPER_ADMIN from tenant analytics routes', async () => {
    const { app, userRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    await createSuperAdminUser(userRepository, companyId);
    const adminAuth = await loginAsSuperAdmin(app);

    const tenant = await request(app).get('/api/v1/analytics/company').set(adminAuth);
    expect(tenant.status).toBe(403);
  });

  it('forbids OWNER from admin analytics', async () => {
    const { app } = createTestContext();
    const { auth } = await createCompanyAndLogin(app);
    const res = await request(app).get('/api/v1/admin/analytics/overview').set(auth);
    expect(res.status).toBe(403);
  });
});
