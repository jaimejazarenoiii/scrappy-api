import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeWarehousePayload } from '../../factories/warehouse.factory.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('warehouse crud api', () => {
  it('creates, reads, and updates a warehouse', async () => {
    const { app } = createTestContext();
    const { auth } = await createCompanyAndLogin(app);
    const create = await request(app)
      .post('/api/v1/warehouses')
      .set(auth)
      .send(makeWarehousePayload());
    expect(create.status).toBe(201);
    const warehouseId = create.body.data.id;
    const read = await request(app).get(`/api/v1/warehouses/${warehouseId}`).set(auth);
    expect(read.status).toBe(200);
    const update = await request(app)
      .patch(`/api/v1/warehouses/${warehouseId}`)
      .set(auth)
      .send({ address: 'Updated Warehouse' });
    expect(update.body.data.address).toBe('Updated Warehouse');
  });
});
