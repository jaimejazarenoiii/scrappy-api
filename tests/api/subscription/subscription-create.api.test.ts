import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext } from '../../setup/test-app.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createSuperAdminUser, loginAsSuperAdmin } from '../../setup/subscription-helpers.js';

describe('subscription create API', () => {
  it('creates subscription as SUPER_ADMIN', async () => {
    const { app, userRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    await createSuperAdminUser(userRepository, companyId);
    const auth = await loginAsSuperAdmin(app);

    const res = await request(app)
      .post(`/api/v1/admin/companies/${companyId}/subscriptions`)
      .set(auth)
      .send({
        planName: 'Pro Annual',
        startsAt: '2026-08-01T00:00:00.000Z',
        endsAt: '2027-07-31T23:59:59.999Z',
        status: 'ACTIVE',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.subscription.planName).toBe('Pro Annual');
    expect(res.body.data.subscriptionStatus).toBe('ACTIVE');
  });

  it('returns 403 for owner', async () => {
    const { app } = createTestContext();
    const { companyId, auth } = await createCompanyAndLogin(app);
    const res = await request(app)
      .post(`/api/v1/admin/companies/${companyId}/subscriptions`)
      .set(auth)
      .send({
        planName: 'Pro',
        startsAt: '2026-08-01T00:00:00.000Z',
        endsAt: '2027-07-31T23:59:59.999Z',
        status: 'ACTIVE',
      });
    expect(res.status).toBe(403);
  });

  it('rejects overlapping periods', async () => {
    const { app, userRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    await createSuperAdminUser(userRepository, companyId);
    const auth = await loginAsSuperAdmin(app);
    const body = {
      planName: 'Pro',
      startsAt: '2026-08-01T00:00:00.000Z',
      endsAt: '2027-07-31T23:59:59.999Z',
      status: 'ACTIVE',
    };
    await request(app)
      .post(`/api/v1/admin/companies/${companyId}/subscriptions`)
      .set(auth)
      .send(body);
    const overlap = await request(app)
      .post(`/api/v1/admin/companies/${companyId}/subscriptions`)
      .set(auth)
      .send({
        ...body,
        startsAt: '2027-01-01T00:00:00.000Z',
        endsAt: '2028-01-01T00:00:00.000Z',
      });
    expect(overlap.status).toBe(400);
  });
});
