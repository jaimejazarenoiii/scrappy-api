import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeVehiclePayload } from '../../factories/vehicle.factory.js';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

async function createStartedTripWithEmployee(
  app: ReturnType<typeof createTestContext>['app'],
  ownerAuth: { Authorization: string },
  employeeId: string,
) {
  const vehicle = await request(app)
    .post('/api/v1/vehicles')
    .set(ownerAuth)
    .send(makeVehiclePayload());
  const vehicleId = vehicle.body.data.id as string;
  const scheduledStart = new Date(Date.now() + 60_000).toISOString();

  const trip = await request(app)
    .post('/api/v1/trips')
    .set(ownerAuth)
    .send({
      vehicleId,
      scheduledStart,
      origin: 'Warehouse',
      destination: 'Site',
      members: [{ employeeId, role: 'DRIVER' }],
    });
  expect(trip.status).toBe(201);

  const started = await request(app)
    .post(`/api/v1/trips/${trip.body.data.id}/start`)
    .set(ownerAuth)
    .send({});
  expect(started.status).toBe(200);
  return trip.body.data.id as string;
}

describe('tracking route append API', () => {
  it('creates retrievable route point after location upsert', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );

    const tripId = await createStartedTripWithEmployee(app, owner.auth, employee.employeeId);
    const capturedAt = new Date().toISOString();

    const upsert = await request(app).put('/api/v1/tracking/location').set(employee.auth).send({
      latitude: 14.5995,
      longitude: 120.9842,
      capturedAt,
      accuracy: 10,
    });
    expect(upsert.status).toBe(200);

    const route = await request(app).get(`/api/v1/trips/${tripId}/tracking/route`).set(owner.auth);

    expect(route.status).toBe(200);
    expect(route.body.data.employees[0].points).toHaveLength(1);
    expect(route.body.data.employees[0].points[0].latitude).toBe(14.5995);
  });

  it('stores every successful upsert in route history by default', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );

    const tripId = await createStartedTripWithEmployee(app, owner.auth, employee.employeeId);
    const base = Date.now();

    await request(app)
      .put('/api/v1/tracking/location')
      .set(employee.auth)
      .send({
        latitude: 14.5995,
        longitude: 120.9842,
        capturedAt: new Date(base).toISOString(),
      });

    await request(app)
      .put('/api/v1/tracking/location')
      .set(employee.auth)
      .send({
        latitude: 14.6001,
        longitude: 120.985,
        capturedAt: new Date(base + 5_000).toISOString(),
      });

    const route = await request(app).get(`/api/v1/trips/${tripId}/tracking/route`).set(owner.auth);

    expect(route.body.data.employees[0].points).toHaveLength(2);
  });
});
