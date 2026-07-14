import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { createTrip } from '../../setup/trip-load-helpers.js';

describe('trip load large payload api', () => {
  it('creates a load with 50 items and returns summary', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const tripId = await createTrip(app, owner.auth);

    const items = Array.from({ length: 50 }, (_, index) => ({
      materialName: `Material-${index + 1}`,
      quantity: index + 1,
      unit: 'KG' as const,
    }));

    const created = await request(app)
      .post(`/api/v1/trips/${tripId}/load`)
      .set(owner.auth)
      .send({ notes: 'Bulk cargo', items });
    expect(created.status).toBe(201);
    expect(created.body.data.items).toHaveLength(50);

    const summary = await request(app).get(`/api/v1/trips/${tripId}/load/summary`).set(owner.auth);
    expect(summary.status).toBe(200);
    expect(summary.body.data.items).toHaveLength(50);
    expect(summary.body.data.items[0].remainingQuantity).toBe(1);
    expect(summary.body.data.items[49].remainingQuantity).toBe(50);
  });
});
