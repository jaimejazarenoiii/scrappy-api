import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeVehiclePayload } from '../../factories/vehicle.factory.js';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('trip get by id api', () => {
  it('returns trip detail for owner', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    const vehicle = await request(app)
      .post('/api/v1/vehicles')
      .set(owner.auth)
      .send(makeVehiclePayload());
    const vehicleId = vehicle.body.data.id as string;

    const scheduledStart = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const created = await request(app).post('/api/v1/trips').set(owner.auth).send({
      vehicleId,
      scheduledStart,
      origin: 'Main warehouse',
      destination: 'Supplier site',
    });

    const tripId = created.body.data.id as string;
    const response = await request(app).get(`/api/v1/trips/${tripId}`).set(owner.auth);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(tripId);
    expect(response.body.data.tripNumber).toMatch(/^TRIP-\d{8}-\d{6}$/);
    expect(response.body.data.vehicle.id).toBe(vehicleId);
    expect(response.body.data.members).toEqual([]);
  });

  it('returns 404 when trip does not exist', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    const response = await request(app)
      .get('/api/v1/trips/65ef6c96-5edd-44e7-9bb6-ae0cafa1e552')
      .set(owner.auth);

    expect(response.status).toBe(404);
  });

  it('returns 403 when employee is not a trip member', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );

    const vehicle = await request(app)
      .post('/api/v1/vehicles')
      .set(owner.auth)
      .send(makeVehiclePayload());
    const vehicleId = vehicle.body.data.id as string;

    const created = await request(app)
      .post('/api/v1/trips')
      .set(owner.auth)
      .send({
        vehicleId,
        scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        origin: 'Main warehouse',
        destination: 'Supplier site',
      });

    const tripId = created.body.data.id as string;
    const response = await request(app).get(`/api/v1/trips/${tripId}`).set(employee.auth);

    expect(response.status).toBe(403);
  });
});
