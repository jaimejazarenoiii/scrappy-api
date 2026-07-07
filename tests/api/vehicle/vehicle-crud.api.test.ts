import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeVehiclePayload } from '../../factories/vehicle.factory.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('vehicle crud api', () => {
  it('creates, reads, and updates a vehicle', async () => {
    const { app } = createTestContext();
    const { auth } = await createCompanyAndLogin(app);
    const create = await request(app).post('/api/v1/vehicles').set(auth).send(makeVehiclePayload());
    expect(create.status).toBe(201);
    const vehicleId = create.body.data.id;
    const read = await request(app).get(`/api/v1/vehicles/${vehicleId}`).set(auth);
    expect(read.status).toBe(200);
    const update = await request(app)
      .patch(`/api/v1/vehicles/${vehicleId}`)
      .set(auth)
      .send({ status: 'MAINTENANCE' });
    expect(update.body.data.status).toBe('MAINTENANCE');
  });
});
