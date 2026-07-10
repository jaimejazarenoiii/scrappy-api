import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeVehiclePayload } from '../../factories/vehicle.factory.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('trip history api', () => {
  it('returns lifecycle history for a trip', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    const vehicle = await request(app)
      .post('/api/v1/vehicles')
      .set(owner.auth)
      .send(makeVehiclePayload());
    const vehicleId = vehicle.body.data.id as string;

    const trip = await request(app)
      .post('/api/v1/trips')
      .set(owner.auth)
      .send({
        vehicleId,
        scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        origin: 'Main warehouse',
        destination: 'Supplier site',
      });

    const tripId = trip.body.data.id as string;
    const response = await request(app).get(`/api/v1/trips/${tripId}/history`).set(owner.auth);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tripId).toBe(tripId);
    expect(response.body.data.events.length).toBeGreaterThanOrEqual(1);
    expect(response.body.data.events[0].action).toBe('CREATED');
  });
});
