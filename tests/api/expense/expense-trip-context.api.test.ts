import type { Express } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeVehiclePayload } from '../../factories/vehicle.factory.js';
import type { InMemoryTripRepository } from '../../setup/in-memory-trip-repository.js';
import { createTestContext } from '../../setup/test-app.js';
import { buildExpensePayload, setupExpenseActors } from '../../setup/expense-helpers.js';

async function seedStartedTrip(
  app: Express,
  auth: Record<string, string>,
  tripRepository: InMemoryTripRepository,
) {
  const vehicle = await request(app).post('/api/v1/vehicles').set(auth).send(makeVehiclePayload());
  const vehicleId = vehicle.body.data.id as string;

  const create = await request(app).post('/api/v1/trips').set(auth).send({
    vehicleId,
    scheduledStart: new Date().toISOString(),
    origin: 'HQ',
    destination: 'Field site',
  });
  const tripId = create.body.data.id as string;

  await tripRepository.start(tripId, create.body.data.companyId as string, {
    actualStart: new Date(),
    startedByUserId: create.body.data.createdByUserId ?? 'test-user',
  });

  return tripId;
}

describe('expense trip context api', () => {
  it('accepts expense linked to a started trip', async () => {
    const { app, userRepository, employeeRepository, tripRepository } = createTestContext();
    const { owner, employee } = await setupExpenseActors(app, userRepository, employeeRepository);
    const tripId = await seedStartedTrip(app, owner.auth, tripRepository);

    const response = await request(app)
      .post('/api/v1/expenses')
      .set(employee.auth)
      .send(buildExpensePayload({ contextType: 'TRIP', tripId }));

    expect(response.status).toBe(201);
    expect(response.body.data.contextType).toBe('TRIP');
    expect(response.body.data.tripId).toBe(tripId);
  });

  it('rejects expense linked to a draft trip', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupExpenseActors(app, userRepository, employeeRepository);

    const vehicle = await request(app)
      .post('/api/v1/vehicles')
      .set(owner.auth)
      .send(makeVehiclePayload());
    const create = await request(app).post('/api/v1/trips').set(owner.auth).send({
      vehicleId: vehicle.body.data.id,
      scheduledStart: new Date().toISOString(),
      origin: 'HQ',
      destination: 'Field',
    });

    const response = await request(app)
      .post('/api/v1/expenses')
      .set(employee.auth)
      .send(buildExpensePayload({ contextType: 'TRIP', tripId: create.body.data.id as string }));

    expect(response.status).toBe(409);
  });
});
