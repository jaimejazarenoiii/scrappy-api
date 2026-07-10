import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeBranchPayload } from '../../factories/branch.factory.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { REPORTS_LIST_ROUTES } from '../../setup/reports-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('report filter consistency api', () => {
  it('echoes appliedCriteria consistently across list routes', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const branch = await request(app)
      .post('/api/v1/branches')
      .set(owner.auth)
      .send(makeBranchPayload());
    const branchId = branch.body.data.id as string;

    const query = {
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-31T23:59:59.999Z',
      branchId,
      includeArchived: true,
      limit: 5,
    };

    for (const route of REPORTS_LIST_ROUTES) {
      const response = await request(app).get(route).query(query).set(owner.auth);
      expect(response.status).toBe(200);
      expect(response.body.data.appliedCriteria).toMatchObject({
        branchId,
        includeArchived: true,
        sortOrder: expect.any(String),
      });
      expect(new Date(response.body.data.appliedCriteria.from).toISOString()).toBe(
        '2026-01-01T00:00:00.000Z',
      );
      expect(new Date(response.body.data.appliedCriteria.to).toISOString()).toBe(
        '2026-01-31T23:59:59.999Z',
      );
    }
  });

  it('allows employee report without date range', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    const response = await request(app).get('/api/v1/reports/employees').set(owner.auth);

    expect(response.status).toBe(200);
    expect(response.body.data.appliedCriteria.from).toBeNull();
    expect(response.body.data.appliedCriteria.to).toBeNull();
  });
});
