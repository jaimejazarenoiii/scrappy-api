import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext } from '../../setup/test-app.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createSuperAdminUser, loginAsSuperAdmin } from '../../setup/subscription-helpers.js';

describe('subscription update API', () => {
  it('updates subscription dates and plan', async () => {
    const { app, userRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    await createSuperAdminUser(userRepository, companyId);
    const auth = await loginAsSuperAdmin(app);

    const created = await request(app)
      .post(`/api/v1/admin/companies/${companyId}/subscriptions`)
      .set(auth)
      .send({
        planName: 'Pro',
        startsAt: '2026-08-01T00:00:00.000Z',
        endsAt: '2027-07-31T23:59:59.999Z',
        status: 'ACTIVE',
      });
    expect(created.status).toBe(201);
    const subscriptionId = created.body.data.subscription.id as string;

    const updated = await request(app)
      .patch(`/api/v1/admin/companies/${companyId}/subscriptions/${subscriptionId}`)
      .set(auth)
      .send({
        planName: 'Pro Extended',
        endsAt: '2028-07-31T23:59:59.999Z',
      });

    expect(updated.status).toBe(200);
    expect(updated.body.data.subscription.planName).toBe('Pro Extended');
    expect(updated.body.data.subscription.endsAt).toBe('2028-07-31T23:59:59.999Z');
    expect(updated.body.data.subscription.startsAt).toBe('2026-08-01T00:00:00.000Z');
  });

  it('rejects overlapping date edits', async () => {
    const { app, userRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    await createSuperAdminUser(userRepository, companyId);
    const auth = await loginAsSuperAdmin(app);

    const first = await request(app)
      .post(`/api/v1/admin/companies/${companyId}/subscriptions`)
      .set(auth)
      .send({
        planName: 'First',
        startsAt: '2026-01-01T00:00:00.000Z',
        endsAt: '2026-06-30T23:59:59.999Z',
        status: 'PENDING',
      });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post(`/api/v1/admin/companies/${companyId}/subscriptions`)
      .set(auth)
      .send({
        planName: 'Second',
        startsAt: '2026-07-01T00:00:00.000Z',
        endsAt: '2026-12-31T23:59:59.999Z',
        status: 'ACTIVE',
      });
    expect(second.status).toBe(201);
    const subscriptionId = second.body.data.subscription.id as string;

    const overlap = await request(app)
      .patch(`/api/v1/admin/companies/${companyId}/subscriptions/${subscriptionId}`)
      .set(auth)
      .send({
        startsAt: '2026-06-01T00:00:00.000Z',
      });

    expect(overlap.status).toBe(400);
  });
});
