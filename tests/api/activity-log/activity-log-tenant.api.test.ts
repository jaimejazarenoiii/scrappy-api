import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { makeCompanyPayload } from '../../factories/company.factory.js';

describe('activity log tenant isolation api', () => {
  it('hides other-company activity logs on list and get', async () => {
    const { app, activityLogRepository } = createTestContext();
    const ownerA = await createCompanyAndLogin(app);
    const seededA = activityLogRepository.seed({
      companyId: ownerA.companyId,
      userId: ownerA.userId,
      action: 'company.updated',
    });

    await request(app)
      .post('/api/v1/companies')
      .send(
        makeCompanyPayload({
          name: 'scrappy-demo-b',
          email: 'company-b@scrappy.test',
          ownerEmail: 'owner-b@scrappy.test',
          ownerPassword: 'password123',
        }),
      );
    const loginB = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'owner-b@scrappy.test', password: 'password123' });
    const ownerB = {
      auth: { Authorization: `Bearer ${loginB.body.data.accessToken}` },
      companyId: loginB.body.data.company.id as string,
    };

    const list = await request(app).get('/api/v1/activity-logs').set(ownerB.auth);
    expect(list.status).toBe(200);
    expect(list.body.data.every((row: { id: string }) => row.id !== seededA.id)).toBe(true);

    const get = await request(app).get(`/api/v1/activity-logs/${seededA.id}`).set(ownerB.auth);
    expect(get.status).toBe(404);
  });
});
