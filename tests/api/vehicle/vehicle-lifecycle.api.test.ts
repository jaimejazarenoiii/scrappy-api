import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeVehiclePayload } from '../../factories/vehicle.factory.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('vehicle lifecycle api', () => {
  it('rejects duplicate plate numbers', async () => {
    const { app } = createTestContext();
    const { auth } = await createCompanyAndLogin(app);
    await request(app).post('/api/v1/vehicles').set(auth).send(makeVehiclePayload());
    const duplicate = await request(app)
      .post('/api/v1/vehicles')
      .set(auth)
      .send(makeVehiclePayload());
    expect(duplicate.status).toBe(409);
  });
});
