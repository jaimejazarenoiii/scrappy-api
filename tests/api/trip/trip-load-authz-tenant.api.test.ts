import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeCompanyPayload } from '../../factories/company.factory.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { createTrip } from '../../setup/trip-load-helpers.js';

describe('trip load tenant isolation api', () => {
  async function loginSecondCompany(app: Parameters<typeof createTestContext>[0]['app']) {
    await request(app)
      .post('/api/v1/companies')
      .send(
        makeCompanyPayload({
          name: 'Other Trip Co',
          email: 'company2@scrappy.test',
          ownerEmail: 'owner2@scrappy.test',
          ownerFullName: 'Owner Two',
        }),
      );
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'owner2@scrappy.test', password: 'password123' });
    expect(login.status).toBe(200);
    return { Authorization: `Bearer ${login.body.data.accessToken}` };
  }

  it('returns 404 when another company accesses trip load endpoints', async () => {
    const { app } = createTestContext();
    const first = await createCompanyAndLogin(app);
    const tripId = await createTrip(app, first.auth);

    await request(app)
      .post(`/api/v1/trips/${tripId}/load`)
      .set(first.auth)
      .send({ items: [{ materialName: 'Copper', quantity: 100, unit: 'KG' }] });

    const secondAuth = await loginSecondCompany(app);

    const getLoad = await request(app).get(`/api/v1/trips/${tripId}/load`).set(secondAuth);
    expect(getLoad.status).toBe(404);

    const getSummary = await request(app)
      .get(`/api/v1/trips/${tripId}/load/summary`)
      .set(secondAuth);
    expect(getSummary.status).toBe(404);

    const createLoad = await request(app)
      .post(`/api/v1/trips/${tripId}/load`)
      .set(secondAuth)
      .send({ items: [{ materialName: 'Steel', quantity: 10, unit: 'KG' }] });
    expect(createLoad.status).toBe(404);

    const enable = await request(app)
      .post(`/api/v1/trips/${tripId}/load/enable`)
      .set(secondAuth)
      .send({});
    expect(enable.status).toBe(404);
  });

  it('returns 404 for unknown trip id within the same company', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const fakeTripId = randomUUID();

    const response = await request(app).get(`/api/v1/trips/${fakeTripId}/load`).set(owner.auth);
    expect(response.status).toBe(404);
  });
});
