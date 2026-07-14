import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { createTrip } from '../../setup/trip-load-helpers.js';

describe('trip start api', () => {
  it('starts a draft trip with starting odometer', async () => {
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

    const response = await request(app)
      .post(`/api/v1/trips/${tripId}/start`)
      .set(owner.auth)
      .send({ startingOdometer: 222 });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('STARTED');
    expect(response.body.data.actualStart).toBeTruthy();
    expect(response.body.data.startingOdometer).toBe(222);
    expect(response.body.data.distance ?? null).toBeNull();
  });

  it('rejects start when trip has no members', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const tripId = await createTrip(app, owner.auth);

    const response = await request(app)
      .post(`/api/v1/trips/${tripId}/start`)
      .set(owner.auth)
      .send({ startingOdometer: 100 });

    expect(response.status).toBe(400);
  });

  it('returns 404 for unknown trip id', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    const response = await request(app)
      .post(`/api/v1/trips/00000000-0000-4000-8000-000000000001/start`)
      .set(owner.auth)
      .send({ startingOdometer: 100 });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
  });
});
