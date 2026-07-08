import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeBranchPayload } from '../../factories/branch.factory.js';
import { makeWarehousePayload } from '../../factories/warehouse.factory.js';
import { createTestContext } from '../../setup/test-app.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';

describe('organization analytics api', () => {
  it('returns branch and warehouse performance lists', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    await request(app).post('/api/v1/branches').set(owner.auth).send(makeBranchPayload());
    await request(app).post('/api/v1/warehouses').set(owner.auth).send(makeWarehousePayload());

    const response = await request(app).get('/api/v1/analytics/organization').set(owner.auth);
    expect(response.status).toBe(200);
    expect(response.body.data.branchPerformance.length).toBeGreaterThanOrEqual(1);
    expect(response.body.data.warehousePerformance.length).toBeGreaterThanOrEqual(1);
    expect(response.body.data.vehicleUtilization).toEqual(expect.any(Array));
  });
});
