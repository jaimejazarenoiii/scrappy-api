import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext } from '../../setup/test-app.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { makeCompanyPayload } from '../../factories/company.factory.js';
import { createSuperAdminUser, loginAsSuperAdmin } from '../../setup/subscription-helpers.js';

describe('subscription history and status API', () => {
  it('lists history and returns me-status', async () => {
    const { app, userRepository } = createTestContext();
    const { companyId, auth } = await createCompanyAndLogin(app);
    await createSuperAdminUser(userRepository, companyId);
    const adminAuth = await loginAsSuperAdmin(app);

    await request(app)
      .post(`/api/v1/admin/companies/${companyId}/subscriptions`)
      .set(adminAuth)
      .send({
        planName: 'Pro',
        startsAt: '2026-01-01T00:00:00.000Z',
        endsAt: '2026-06-30T23:59:59.999Z',
        status: 'ACTIVE',
      });

    const history = await request(app)
      .get(`/api/v1/admin/companies/${companyId}/subscriptions`)
      .set(adminAuth);
    expect(history.status).toBe(200);
    expect(history.body.data).toHaveLength(1);

    const adminStatus = await request(app)
      .get(`/api/v1/admin/companies/${companyId}/subscription-status`)
      .set(adminAuth);
    expect(adminStatus.body.data.subscriptionStatus).toBe('ACTIVE');

    const meStatus = await request(app).get('/api/v1/companies/me/subscription-status').set(auth);
    expect(meStatus.status).toBe(200);
    expect(meStatus.body.data.subscriptionStatus).toBe('ACTIVE');

    const subscriptionId = history.body.data[0].id as string;
    const detail = await request(app)
      .get(`/api/v1/admin/companies/${companyId}/subscriptions/${subscriptionId}`)
      .set(adminAuth);
    expect(detail.status).toBe(200);
  });

  it('returns 404 for subscription under wrong company', async () => {
    const { app, userRepository } = createTestContext();
    const first = await createCompanyAndLogin(app);
    await createSuperAdminUser(userRepository, first.companyId);
    const adminAuth = await loginAsSuperAdmin(app);

    const createRes = await request(app)
      .post(`/api/v1/admin/companies/${first.companyId}/subscriptions`)
      .set(adminAuth)
      .send({
        planName: 'Pro',
        startsAt: '2026-01-01T00:00:00.000Z',
        endsAt: '2026-12-31T23:59:59.999Z',
        status: 'ACTIVE',
      });
    const subscriptionId = createRes.body.data.subscription.id as string;

    const otherCompany = await request(app)
      .post('/api/v1/companies')
      .send({
        ...makeCompanyPayload(),
        name: 'Other Co',
        ownerEmail: 'owner2@scrappy.test',
      });
    const otherCompanyId = otherCompany.body.data.company.id as string;

    const wrong = await request(app)
      .get(`/api/v1/admin/companies/${otherCompanyId}/subscriptions/${subscriptionId}`)
      .set(adminAuth);
    expect(wrong.status).toBe(404);
  });
});
