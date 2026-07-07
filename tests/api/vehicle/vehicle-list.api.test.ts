import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeVehiclePayload } from '../../factories/vehicle.factory.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('vehicle list api', () => {
  it('filters vehicles by status', async () => {
    const { app } = createTestContext();
    const { auth } = await createCompanyAndLogin(app);
    await request(app).post('/api/v1/vehicles').set(auth).send(makeVehiclePayload());
    await request(app)
      .post('/api/v1/vehicles')
      .set(auth)
      .send(makeVehiclePayload({ plateNumber: 'XYZ-9999', status: 'MAINTENANCE' }));
    const available = await request(app).get('/api/v1/vehicles?status=AVAILABLE').set(auth);
    expect(available.body.data).toHaveLength(1);
  });
});
