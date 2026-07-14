import request from 'supertest';
import type { Express } from 'express';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';
import { createTrip } from '../../setup/trip-load-helpers.js';

async function setupTripWithLoad(
  app: Express,
  ownerAuth: Record<string, string>,
  employeeId: string,
  options: { strict?: boolean } = {},
) {
  const tripId = await createTrip(app, ownerAuth, {
    members: [{ employeeId, role: 'DRIVER' }],
  });
  await request(app)
    .post(`/api/v1/trips/${tripId}/load`)
    .set(ownerAuth)
    .send({ items: [{ materialName: 'Copper', quantity: 100, unit: 'KG' }] });
  if (options.strict) {
    await request(app)
      .post(`/api/v1/trips/${tripId}/load/enable`)
      .set(ownerAuth)
      .send({ strictLoadValidation: true });
  }
  return tripId;
}

describe('trip load outbound validation api', () => {
  it('blocks an oversell on a strict trip', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );
    const tripId = await setupTripWithLoad(app, owner.auth, employee.employeeId, { strict: true });

    const response = await createDraftTransaction(app, employee.auth, [employee.employeeId], {
      direction: 'OUTBOUND',
      locationType: 'TRIP',
      tripId,
      outsideLocationName: undefined,
      outsideAddress: undefined,
      items: [{ materialName: 'Copper', weight: 150, unit: 'KG', price: 10 }],
    });
    expect(response.status).toBe(409);
  });

  it('warns (non-strict) on an oversell but still creates the transaction', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );
    const tripId = await setupTripWithLoad(app, owner.auth, employee.employeeId);

    const response = await createDraftTransaction(app, employee.auth, [employee.employeeId], {
      direction: 'OUTBOUND',
      locationType: 'TRIP',
      tripId,
      outsideLocationName: undefined,
      outsideAddress: undefined,
      items: [{ materialName: 'Copper', weight: 150, unit: 'KG', price: 10 }],
    });
    expect(response.status).toBe(201);
    expect(response.body.meta.warnings).toHaveLength(1);
    expect(response.body.meta.warnings[0].materialName).toBe('Copper');
  });

  it('never validates inbound transactions against the load', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );
    const tripId = await setupTripWithLoad(app, owner.auth, employee.employeeId, { strict: true });

    const response = await createDraftTransaction(app, employee.auth, [employee.employeeId], {
      direction: 'INBOUND',
      locationType: 'TRIP',
      tripId,
      outsideLocationName: undefined,
      outsideAddress: undefined,
      items: [{ materialName: 'Copper', weight: 150, unit: 'KG', price: 10 }],
    });
    expect(response.status).toBe(201);
    expect(response.body.meta.warnings).toBeUndefined();
  });

  it('skips validation for materials not present in the load', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );
    const tripId = await setupTripWithLoad(app, owner.auth, employee.employeeId, { strict: true });

    const response = await createDraftTransaction(app, employee.auth, [employee.employeeId], {
      direction: 'OUTBOUND',
      locationType: 'TRIP',
      tripId,
      outsideLocationName: undefined,
      outsideAddress: undefined,
      items: [{ materialName: 'Gold', weight: 150, unit: 'KG', price: 10 }],
    });
    expect(response.status).toBe(201);
    expect(response.body.meta.warnings).toBeUndefined();
  });
});
