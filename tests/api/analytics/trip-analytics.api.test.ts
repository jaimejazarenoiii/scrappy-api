import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('trip analytics api', () => {
  it('returns zeroed trip metrics when no trips exist', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    const response = await request(app).get('/api/v1/analytics/trips').set(owner.auth);
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      totalTrips: 0,
      activeTrips: 0,
      completedTrips: 0,
      cancelledTrips: 0,
      averageTripDurationMinutes: 0,
      vehicleUtilization: expect.any(Array),
      mostActiveVehicles: expect.any(Array),
      mostActiveDrivers: expect.any(Array),
    });
  });
});
