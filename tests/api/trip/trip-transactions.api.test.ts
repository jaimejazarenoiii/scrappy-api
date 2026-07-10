import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeVehiclePayload } from '../../factories/vehicle.factory.js';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('trip linked transactions api', () => {
  it('lists transactions linked to a trip', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );

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
        members: [{ employeeId: employee.employeeId, role: 'DRIVER' }],
      });
    expect(trip.status).toBe(201);
    const tripId = trip.body.data.id as string;

    const created = await createDraftTransaction(app, employee.auth, [employee.employeeId], {
      locationType: 'TRIP',
      tripId,
      outsideLocationName: undefined,
      outsideAddress: undefined,
    });
    expect(created.status).toBe(201);

    const response = await request(app).get(`/api/v1/trips/${tripId}/transactions`).set(owner.auth);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].tripId).toBe(tripId);
    expect(response.body.data[0].locationType).toBe('TRIP');
  });

  it('supports tripId filter on company transaction list', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );

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
        members: [{ employeeId: employee.employeeId, role: 'DRIVER' }],
      });
    const tripId = trip.body.data.id as string;

    await createDraftTransaction(app, employee.auth, [employee.employeeId], {
      locationType: 'TRIP',
      tripId,
      outsideLocationName: undefined,
      outsideAddress: undefined,
    });

    const response = await request(app)
      .get(`/api/v1/transactions?tripId=${tripId}&locationType=TRIP`)
      .set(owner.auth);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].tripId).toBe(tripId);
  });
});
