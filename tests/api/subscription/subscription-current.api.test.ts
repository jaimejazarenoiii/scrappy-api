import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext } from '../../setup/test-app.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createSuperAdminUser, loginAsSuperAdmin } from '../../setup/subscription-helpers.js';

describe('subscription current API', () => {
  it('returns ACTIVE period with audit fields', async () => {
    const { app, userRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    await createSuperAdminUser(userRepository, companyId);
    const adminAuth = await loginAsSuperAdmin(app);

    const create = await request(app)
      .post(`/api/v1/admin/companies/${companyId}/subscriptions`)
      .set(adminAuth)
      .send({
        planName: 'Pro',
        startsAt: '2026-01-01T00:00:00.000Z',
        endsAt: '2026-12-31T23:59:59.999Z',
        status: 'ACTIVE',
      });
    expect(create.status).toBe(201);
    expect(create.body.data.subscription.activatedAt).toBeTruthy();

    const current = await request(app)
      .get(`/api/v1/admin/companies/${companyId}/subscriptions/current`)
      .set(adminAuth);
    expect(current.status).toBe(200);
    expect(current.body.data.status).toBe('ACTIVE');
    expect(current.body.data.planName).toBe('Pro');
    expect(current.body.data.activatedAt).toBeTruthy();
  });

  it('returns 404 when no ACTIVE period exists', async () => {
    const { app, userRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    await createSuperAdminUser(userRepository, companyId);
    const adminAuth = await loginAsSuperAdmin(app);

    const response = await request(app)
      .get(`/api/v1/admin/companies/${companyId}/subscriptions/current`)
      .set(adminAuth);
    expect(response.status).toBe(404);
  });

  it('returns 404 after expire removes ACTIVE period', async () => {
    const { app, userRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    await createSuperAdminUser(userRepository, companyId);
    const adminAuth = await loginAsSuperAdmin(app);

    await request(app)
      .post(`/api/v1/admin/companies/${companyId}/subscriptions`)
      .set(adminAuth)
      .send({
        planName: 'Pro',
        startsAt: '2026-01-01T00:00:00.000Z',
        endsAt: '2026-12-31T23:59:59.999Z',
        status: 'ACTIVE',
      });

    await request(app)
      .post(`/api/v1/admin/companies/${companyId}/subscriptions/expire`)
      .set(adminAuth)
      .send({});

    const response = await request(app)
      .get(`/api/v1/admin/companies/${companyId}/subscriptions/current`)
      .set(adminAuth);
    expect(response.status).toBe(404);
  });
});
