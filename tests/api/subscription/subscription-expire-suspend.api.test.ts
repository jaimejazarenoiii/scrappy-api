import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext } from '../../setup/test-app.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createSuperAdminUser, loginAsSuperAdmin } from '../../setup/subscription-helpers.js';

describe('subscription expire/suspend API', () => {
  it('expire blocks tenant login and inactivates accounts', async () => {
    const { app, userRepository, companyRepository, sessionRepository } = createTestContext();
    const { companyId, userId } = await createCompanyAndLogin(app);
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

    await sessionRepository.create({
      id: 'sess-owner',
      userId,
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 86400000),
    });

    const expire = await request(app)
      .post(`/api/v1/admin/companies/${companyId}/subscriptions/expire`)
      .set(adminAuth)
      .send({});
    expect(expire.status).toBe(200);
    expect(expire.body.data.subscriptionStatus).toBe('EXPIRED');

    const company = companyRepository.companies.get(companyId)!;
    expect(company.status).toBe('INACTIVE');
    expect(company.subscriptionStatus).toBe('EXPIRED');

    const owner = [...userRepository.users.values()].find((u) => u.id === userId)!;
    expect(owner.status).toBe('INACTIVE');

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'owner@scrappy.test', password: 'password123' });
    expect(login.status).toBe(409);
    expect(login.body.error.code).toBe('SUBSCRIPTION_INACTIVE');
  });

  it('suspend blocks tenant login', async () => {
    const { app, userRepository, companyRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    await createSuperAdminUser(userRepository, companyId);
    const adminAuth = await loginAsSuperAdmin(app);

    const suspend = await request(app)
      .post(`/api/v1/admin/companies/${companyId}/subscriptions/suspend`)
      .set(adminAuth)
      .send({});
    expect(suspend.status).toBe(200);
    expect(companyRepository.companies.get(companyId)!.subscriptionStatus).toBe('SUSPENDED');

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'owner@scrappy.test', password: 'password123' });
    expect(login.status).toBe(409);
    expect(login.body.error.code).toBe('SUBSCRIPTION_INACTIVE');
  });
});
