import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext } from '../../setup/test-app.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createSuperAdminUser, loginAsSuperAdmin } from '../../setup/subscription-helpers.js';

describe('subscription reactivate API', () => {
  it('reactivates suspended company and restores tenant login', async () => {
    const { app, userRepository, companyRepository } = createTestContext();
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
      .post(`/api/v1/admin/companies/${companyId}/subscriptions/suspend`)
      .set(adminAuth)
      .send({});

    const blockedLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'owner@scrappy.test', password: 'password123' });
    expect(blockedLogin.status).toBe(409);

    const reactivate = await request(app)
      .post(`/api/v1/admin/companies/${companyId}/subscriptions/reactivate`)
      .set(adminAuth)
      .send({});
    expect(reactivate.status).toBe(200);
    expect(reactivate.body.data.subscriptionStatus).toBe('ACTIVE');
    expect(companyRepository.companies.get(companyId)!.status).toBe('ACTIVE');

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'owner@scrappy.test', password: 'password123' });
    expect(login.status).toBe(200);
  });

  it('rejects reactivate when company is not suspended', async () => {
    const { app, userRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    await createSuperAdminUser(userRepository, companyId);
    const adminAuth = await loginAsSuperAdmin(app);

    const response = await request(app)
      .post(`/api/v1/admin/companies/${companyId}/subscriptions/reactivate`)
      .set(adminAuth)
      .send({});
    expect(response.status).toBe(409);
  });

  it('returns 403 for tenant users', async () => {
    const { app } = createTestContext();
    const { companyId, auth } = await createCompanyAndLogin(app);

    const response = await request(app)
      .post(`/api/v1/admin/companies/${companyId}/subscriptions/reactivate`)
      .set(auth)
      .send({});
    expect(response.status).toBe(403);
  });
});
