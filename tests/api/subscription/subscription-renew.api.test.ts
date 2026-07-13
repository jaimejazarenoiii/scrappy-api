import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext } from '../../setup/test-app.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createSuperAdminUser, loginAsSuperAdmin } from '../../setup/subscription-helpers.js';

async function seedActiveSubscription(
  app: ReturnType<typeof createTestContext>['app'],
  companyId: string,
  auth: { Authorization: string },
) {
  return request(app).post(`/api/v1/admin/companies/${companyId}/subscriptions`).set(auth).send({
    planName: 'Year 1',
    startsAt: '2026-01-01T00:00:00.000Z',
    endsAt: '2026-12-31T23:59:59.999Z',
    status: 'ACTIVE',
  });
}

describe('subscription renew API', () => {
  it('renews by closing prior ACTIVE and creating new period', async () => {
    const { app, userRepository, companySubscriptionRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    await createSuperAdminUser(userRepository, companyId);
    const auth = await loginAsSuperAdmin(app);
    await seedActiveSubscription(app, companyId, auth);

    const res = await request(app)
      .post(`/api/v1/admin/companies/${companyId}/subscriptions/renew`)
      .set(auth)
      .send({
        planName: 'Year 2',
        startsAt: '2027-01-01T00:00:00.000Z',
        endsAt: '2027-12-31T23:59:59.999Z',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.subscription.planName).toBe('Year 2');
    const periods = [...companySubscriptionRepository.subscriptions.values()].filter(
      (p) => p.companyId === companyId,
    );
    expect(periods).toHaveLength(2);
    expect(periods.some((p) => p.status === 'EXPIRED')).toBe(true);
    expect(periods.some((p) => p.status === 'ACTIVE')).toBe(true);
  });
});
