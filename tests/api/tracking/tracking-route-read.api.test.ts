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

describe('tracking route read API', () => {
  it('returns partial route for started trip and supports employee filter', async () => {
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
        capturedAt: new Date(base + 20_000).toISOString(),
      });

    const route = await request(app).get(`/api/v1/trips/${tripId}/tracking/route`).set(owner.auth);

    expect(route.status).toBe(200);
    expect(route.body.data.tripStatus).toBe('STARTED');
    expect(route.body.data.employees[0].points).toHaveLength(2);

    const filtered = await request(app)
      .get(`/api/v1/trips/${tripId}/tracking/route?employeeId=${employee.employeeId}`)
      .set(owner.auth);

    expect(filtered.body.data.employees).toHaveLength(1);
  });

  it('returns empty points for member without transmissions', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const driver = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
      'driver@scrappy.test',
    );
    const helper = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
      'helper@scrappy.test',
    );

    const vehicle = await request(app)
      .post('/api/v1/vehicles')
      .set(owner.auth)
      .send(makeVehiclePayload());
    const trip = await request(app)
      .post('/api/v1/trips')
      .set(owner.auth)
      .send({
        vehicleId: vehicle.body.data.id,
        scheduledStart: new Date(Date.now() + 60_000).toISOString(),
        origin: 'A',
        destination: 'B',
        members: [
          { employeeId: driver.employeeId, role: 'DRIVER' },
          { employeeId: helper.employeeId, role: 'HELPER' },
        ],
      });
    await request(app).post(`/api/v1/trips/${trip.body.data.id}/start`).set(owner.auth).send({});

    await request(app).put('/api/v1/tracking/location').set(driver.auth).send({
      latitude: 14.5995,
      longitude: 120.9842,
      capturedAt: new Date().toISOString(),
    });

    const route = await request(app)
      .get(`/api/v1/trips/${trip.body.data.id}/tracking/route`)
      .set(owner.auth);

    const helperEntry = route.body.data.employees.find(
      (entry: { employeeId: string }) => entry.employeeId === helper.employeeId,
    );
    expect(helperEntry.points).toHaveLength(0);
  });
});
