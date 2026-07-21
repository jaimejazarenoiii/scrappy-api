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

describe('tracking upsert API', () => {
  it('allows employee to upsert location on started trip', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );

    await createStartedTripWithEmployee(app, owner.auth, employee.employeeId);

    const capturedAt = new Date().toISOString();
    const response = await request(app).put('/api/v1/tracking/location').set(employee.auth).send({
      latitude: 14.5995,
      longitude: 120.9842,
      capturedAt,
      accuracy: 10,
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.trackingStatus).toBe('ONLINE');
    expect(response.body.data.latitude).toBe(14.5995);
  });

  it('rejects location when trip is not started', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );

    const response = await request(app).put('/api/v1/tracking/location').set(employee.auth).send({
      latitude: 14.5995,
      longitude: 120.9842,
      capturedAt: new Date().toISOString(),
    });

    expect(response.status).toBe(409);
  });

  it('rejects mock locations', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );

    await createStartedTripWithEmployee(app, owner.auth, employee.employeeId);

    const response = await request(app).put('/api/v1/tracking/location').set(employee.auth).send({
      latitude: 14.5995,
      longitude: 120.9842,
      capturedAt: new Date().toISOString(),
      isMockLocation: true,
    });

    expect(response.status).toBe(403);
  });
});

describe('tracking read API', () => {
  it('allows owner to read trip tracking locations', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );

    const tripId = await createStartedTripWithEmployee(app, owner.auth, employee.employeeId);

    await request(app).put('/api/v1/tracking/location').set(employee.auth).send({
      latitude: 14.5995,
      longitude: 120.9842,
      capturedAt: new Date().toISOString(),
    });

    const response = await request(app)
      .get(`/api/v1/trips/${tripId}/tracking/locations`)
      .set(owner.auth);

    expect(response.status).toBe(200);
    expect(response.body.data.trackingActive).toBe(true);
    expect(response.body.data.employees).toHaveLength(1);
    expect(response.body.data.employees[0].location.latitude).toBe(14.5995);
  });

  it('denies employee from reading peer location', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );

    const response = await request(app)
      .get(`/api/v1/tracking/employees/${employee.employeeId}/location`)
      .set(employee.auth);

    expect(response.status).toBe(403);
  });
});

describe('tracking trip complete', () => {
  it('stops tracking after trip complete', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );

    const tripId = await createStartedTripWithEmployee(app, owner.auth, employee.employeeId);

    await request(app).put('/api/v1/tracking/location').set(employee.auth).send({
      latitude: 14.5995,
      longitude: 120.9842,
      capturedAt: new Date().toISOString(),
    });

    const complete = await request(app)
      .post(`/api/v1/trips/${tripId}/complete`)
      .set(owner.auth)
      .send({});
    expect(complete.status).toBe(200);

    const retry = await request(app).put('/api/v1/tracking/location').set(employee.auth).send({
      latitude: 14.6,
      longitude: 120.99,
      capturedAt: new Date().toISOString(),
    });
    expect(retry.status).toBe(409);
  });
});
