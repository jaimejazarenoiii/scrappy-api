import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';
import { createTrip } from '../../setup/trip-load-helpers.js';

async function setup() {
  const ctx = createTestContext();
  const { owner, employee } = await setupTransactionActors(
    ctx.app,
    ctx.userRepository,
    ctx.employeeRepository,
  );
  const tripId = await createTrip(ctx.app, owner.auth, {
    members: [{ employeeId: employee.employeeId, role: 'DRIVER' }],
  });
  await request(ctx.app)
    .post(`/api/v1/trips/${tripId}/load`)
    .set(owner.auth)
    .send({
      items: [
        { materialName: 'Copper', quantity: 100, unit: 'KG' },
        { materialName: 'Steel', quantity: 50, unit: 'KG' },
      ],
    });
  return { ...ctx, owner, employee, tripId };
}

describe('trip load summary api', () => {
  it('returns per-item loaded, outbound and remaining quantities', async () => {
    const { app, owner, employee, tripId } = await setup();

    await createDraftTransaction(app, employee.auth, [employee.employeeId], {
      direction: 'OUTBOUND',
      locationType: 'TRIP',
      tripId,
      outsideLocationName: undefined,
      outsideAddress: undefined,
      items: [{ materialName: 'Copper', weight: 30, unit: 'KG', price: 10 }],
    });

    const summary = await request(app).get(`/api/v1/trips/${tripId}/load/summary`).set(owner.auth);
    expect(summary.status).toBe(200);
    const copper = summary.body.data.items.find(
      (item: { materialName: string }) => item.materialName === 'Copper',
    );
    expect(copper.loadedQuantity).toBe(100);
    expect(copper.outboundQuantity).toBe(30);
    expect(copper.remainingQuantity).toBe(70);
  });

  it('allows an assigned employee to view the summary', async () => {
    const { app, employee, tripId } = await setup();
    const summary = await request(app)
      .get(`/api/v1/trips/${tripId}/load/summary`)
      .set(employee.auth);
    expect(summary.status).toBe(200);
  });

  it('forbids a non-member employee from viewing the summary', async () => {
    const { app, userRepository, employeeRepository, owner, tripId } = await setup();
    const outsider = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
      'outsider@scrappy.test',
    );
    const summary = await request(app)
      .get(`/api/v1/trips/${tripId}/load/summary`)
      .set(outsider.auth);
    expect(summary.status).toBe(403);
  });
});
