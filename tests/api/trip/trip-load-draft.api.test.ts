import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { createTrip } from '../../setup/trip-load-helpers.js';

describe('trip load draft crud api', () => {
  it('creates, reads, updates and deletes a draft trip load', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const tripId = await createTrip(app, owner.auth);

    const created = await request(app)
      .post(`/api/v1/trips/${tripId}/load`)
      .set(owner.auth)
      .send({
        notes: 'Morning cargo',
        items: [
          { materialName: 'Copper', quantity: 100, unit: 'KG' },
          { materialName: 'Steel', quantity: 50, unit: 'KG' },
        ],
      });
    expect(created.status).toBe(201);
    expect(created.body.data.items).toHaveLength(2);

    const tripDetail = await request(app).get(`/api/v1/trips/${tripId}`).set(owner.auth);
    expect(tripDetail.body.data.loadEnabled).toBe(true);

    const fetched = await request(app).get(`/api/v1/trips/${tripId}/load`).set(owner.auth);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.notes).toBe('Morning cargo');

    const updated = await request(app)
      .patch(`/api/v1/trips/${tripId}/load`)
      .set(owner.auth)
      .send({ notes: 'Updated notes' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.notes).toBe('Updated notes');

    const deleted = await request(app).delete(`/api/v1/trips/${tripId}/load`).set(owner.auth);
    expect(deleted.status).toBe(200);
    expect(deleted.body.data.loadEnabled).toBe(true);

    const afterDelete = await request(app).get(`/api/v1/trips/${tripId}/load`).set(owner.auth);
    expect(afterDelete.status).toBe(404);
  });

  it('rejects a second load for the same trip', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const tripId = await createTrip(app, owner.auth);

    await request(app)
      .post(`/api/v1/trips/${tripId}/load`)
      .set(owner.auth)
      .send({ items: [{ materialName: 'Copper', quantity: 100, unit: 'KG' }] });

    const second = await request(app)
      .post(`/api/v1/trips/${tripId}/load`)
      .set(owner.auth)
      .send({ items: [{ materialName: 'Steel', quantity: 10, unit: 'KG' }] });
    expect(second.status).toBe(409);
  });

  it('rejects duplicate materials on create', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const tripId = await createTrip(app, owner.auth);

    const response = await request(app)
      .post(`/api/v1/trips/${tripId}/load`)
      .set(owner.auth)
      .send({
        items: [
          { materialName: 'Copper', quantity: 100, unit: 'KG' },
          { materialName: 'copper', quantity: 20, unit: 'KG' },
        ],
      });
    expect(response.status).toBe(400);
  });

  it('manages load items with unique material enforcement', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const tripId = await createTrip(app, owner.auth);

    await request(app)
      .post(`/api/v1/trips/${tripId}/load`)
      .set(owner.auth)
      .send({ items: [{ materialName: 'Copper', quantity: 100, unit: 'KG' }] });

    const added = await request(app)
      .post(`/api/v1/trips/${tripId}/load/items`)
      .set(owner.auth)
      .send({ materialName: 'Steel', quantity: 30, unit: 'KG' });
    expect(added.status).toBe(201);
    const itemId = added.body.data.id as string;

    const duplicate = await request(app)
      .post(`/api/v1/trips/${tripId}/load/items`)
      .set(owner.auth)
      .send({ materialName: 'copper', quantity: 5, unit: 'KG' });
    expect(duplicate.status).toBe(400);

    const updatedItem = await request(app)
      .patch(`/api/v1/trips/${tripId}/load/items/${itemId}`)
      .set(owner.auth)
      .send({ quantity: 45 });
    expect(updatedItem.status).toBe(200);
    expect(updatedItem.body.data.quantity).toBe(45);

    const removed = await request(app)
      .delete(`/api/v1/trips/${tripId}/load/items/${itemId}`)
      .set(owner.auth);
    expect(removed.status).toBe(200);
  });

  it('forbids employees from mutating a load', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );
    const tripId = await createTrip(app, owner.auth, {
      members: [{ employeeId: employee.employeeId, role: 'DRIVER' }],
    });

    const response = await request(app)
      .post(`/api/v1/trips/${tripId}/load`)
      .set(employee.auth)
      .send({ items: [{ materialName: 'Copper', quantity: 100, unit: 'KG' }] });
    expect(response.status).toBe(403);
  });
});
