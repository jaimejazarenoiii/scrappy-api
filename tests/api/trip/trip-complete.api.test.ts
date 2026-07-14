import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { createTrip } from '../../setup/trip-load-helpers.js';

describe('trip complete api', () => {
  it('completes a started trip with ending odometer', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );
    const tripId = await createTrip(app, owner.auth, {
      members: [{ employeeId: employee.employeeId, role: 'DRIVER' }],
    });

    await request(app)
      .post(`/api/v1/trips/${tripId}/start`)
      .set(owner.auth)
      .send({ startingOdometer: 200 });

    const response = await request(app)
      .post(`/api/v1/trips/${tripId}/complete`)
      .set(owner.auth)
      .send({ endingOdometer: 25 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('COMPLETED');
    expect(response.body.data.actualEnd).toBeTruthy();
  });

  it('returns 404 for unknown trip id', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    const response = await request(app)
      .post(`/api/v1/trips/00000000-0000-4000-8000-000000000001/complete`)
      .set(owner.auth)
      .send({ endingOdometer: 25 });

    expect(response.status).toBe(404);
  });
});
