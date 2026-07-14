import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { createTrip } from '../../setup/trip-load-helpers.js';

describe('trip load lifecycle lock api', () => {
  it('blocks load mutations once the trip has started', async () => {
    const { app, tripRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const tripId = await createTrip(app, owner.auth);

    const created = await request(app)
      .post(`/api/v1/trips/${tripId}/load`)
      .set(owner.auth)
      .send({ items: [{ materialName: 'Copper', quantity: 100, unit: 'KG' }] });
    expect(created.status).toBe(201);
    const itemId = created.body.data.items[0].id as string;

    await tripRepository.start(tripId, owner.companyId, {
      actualStart: new Date(),
      startedByUserId: owner.userId,
    });

    const patchLoad = await request(app)
      .patch(`/api/v1/trips/${tripId}/load`)
      .set(owner.auth)
      .send({ notes: 'late change' });
    expect(patchLoad.status).toBe(409);

    const addItem = await request(app)
      .post(`/api/v1/trips/${tripId}/load/items`)
      .set(owner.auth)
      .send({ materialName: 'Steel', quantity: 10, unit: 'KG' });
    expect(addItem.status).toBe(409);

    const updateItem = await request(app)
      .patch(`/api/v1/trips/${tripId}/load/items/${itemId}`)
      .set(owner.auth)
      .send({ quantity: 5 });
    expect(updateItem.status).toBe(409);

    const removeItem = await request(app)
      .delete(`/api/v1/trips/${tripId}/load/items/${itemId}`)
      .set(owner.auth);
    expect(removeItem.status).toBe(409);

    const disable = await request(app).post(`/api/v1/trips/${tripId}/load/disable`).set(owner.auth);
    expect(disable.status).toBe(409);
  });

  it('still allows reading the load and summary after start', async () => {
    const { app, tripRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const tripId = await createTrip(app, owner.auth);

    await request(app)
      .post(`/api/v1/trips/${tripId}/load`)
      .set(owner.auth)
      .send({ items: [{ materialName: 'Copper', quantity: 100, unit: 'KG' }] });

    await tripRepository.start(tripId, owner.companyId, {
      actualStart: new Date(),
      startedByUserId: owner.userId,
    });

    const load = await request(app).get(`/api/v1/trips/${tripId}/load`).set(owner.auth);
    expect(load.status).toBe(200);

    const summary = await request(app).get(`/api/v1/trips/${tripId}/load/summary`).set(owner.auth);
    expect(summary.status).toBe(200);
    expect(summary.body.data.items[0].remainingQuantity).toBe(100);
  });
});
