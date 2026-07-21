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
  const trip = await request(app)
    .post('/api/v1/trips')
    .set(ownerAuth)
    .send({
      vehicleId: vehicle.body.data.id,
      scheduledStart: new Date(Date.now() + 60_000).toISOString(),
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

describe('tracking session sync API', () => {
  it('returns ACTIVE_TRIP when employee has a started trip', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );

    const tripId = await createStartedTripWithEmployee(app, owner.auth, employee.employeeId);

    const response = await request(app).get('/api/v1/tracking/session').set(employee.auth);

    expect(response.status).toBe(200);
    expect(response.body.data.sessionState).toBe('ACTIVE_TRIP');
    expect(response.body.data.canTrack).toBe(true);
    expect(response.body.data.trip.id).toBe(tripId);
  });

  it('returns NO_ACTIVE_TRIP when employee has no started trip', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );

    const response = await request(app).get('/api/v1/tracking/session').set(employee.auth);

    expect(response.status).toBe(200);
    expect(response.body.data.sessionState).toBe('NO_ACTIVE_TRIP');
    expect(response.body.data.canTrack).toBe(false);
  });

  it('returns TRIP_ENDED when lastKnownTripId refers to a completed trip', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );

    const tripId = await createStartedTripWithEmployee(app, owner.auth, employee.employeeId);

    await request(app).post(`/api/v1/trips/${tripId}/complete`).set(owner.auth).send({});

    const response = await request(app)
      .get(`/api/v1/tracking/session?lastKnownTripId=${tripId}`)
      .set(employee.auth);

    expect(response.status).toBe(200);
    expect(response.body.data.sessionState).toBe('TRIP_ENDED');
    expect(response.body.data.canTrack).toBe(false);
    expect(response.body.data.endedTrip.id).toBe(tripId);
    expect(response.body.data.endedTrip.status).toBe('COMPLETED');
  });

  it('lists available started trips for employee', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );

    const tripId = await createStartedTripWithEmployee(app, owner.auth, employee.employeeId);

    const response = await request(app).get('/api/v1/tracking/available-trips').set(employee.auth);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe(tripId);
    expect(response.body.data[0].status).toBe('STARTED');
  });

  it('denies owner from session sync', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    const response = await request(app).get('/api/v1/tracking/session').set(owner.auth);

    expect(response.status).toBe(403);
  });
});
