import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeWarehousePayload } from '../../factories/warehouse.factory.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('warehouse list api', () => {
  it('lists warehouses and excludes archived', async () => {
    const { app } = createTestContext();
    const { auth } = await createCompanyAndLogin(app);
    const created = await request(app)
      .post('/api/v1/warehouses')
      .set(auth)
      .send(makeWarehousePayload());
    const list = await request(app).get('/api/v1/warehouses').set(auth);
    expect(list.body.data).toHaveLength(1);
    await request(app).post(`/api/v1/warehouses/${created.body.data.id}/archive`).set(auth);
    const after = await request(app).get('/api/v1/warehouses').set(auth);
    expect(after.body.data).toHaveLength(0);
  });
});
