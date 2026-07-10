import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeVehiclePayload } from '../../factories/vehicle.factory.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('trip create api', () => {
  it('creates a draft trip with trip number', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    const vehicle = await request(app)
      .post('/api/v1/vehicles')
      .set(owner.auth)
      .send(makeVehiclePayload());
    const vehicleId = vehicle.body.data.id as string;

    const scheduledStart = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const response = await request(app).post('/api/v1/trips').set(owner.auth).send({
      vehicleId,
      scheduledStart,
      origin: 'Main warehouse',
      destination: 'Supplier site',
      notes: 'Morning pickup run',
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('DRAFT');
    expect(response.body.data.tripNumber).toMatch(/^TRIP-\d{8}-\d{6}$/);
    expect(response.body.data.vehicle.id).toBe(vehicleId);
    expect(response.body.data.members).toEqual([]);
  });
});
