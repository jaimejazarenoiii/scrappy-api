import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeWarehousePayload } from '../../factories/warehouse.factory.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('warehouse lifecycle api', () => {
  it('rejects duplicate warehouse names', async () => {
    const { app } = createTestContext();
    const { auth } = await createCompanyAndLogin(app);
    await request(app).post('/api/v1/warehouses').set(auth).send(makeWarehousePayload());
    const duplicate = await request(app)
      .post('/api/v1/warehouses')
      .set(auth)
      .send(makeWarehousePayload());
    expect(duplicate.status).toBe(409);
  });
});
