import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeBranchPayload } from '../../factories/branch.factory.js';
import { createTestContext } from '../../setup/test-app.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';

describe('analytics filter consistency api', () => {
  it('echoes applied filters consistently across dashboards', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const branch = await request(app)
      .post('/api/v1/branches')
      .set(owner.auth)
      .send(makeBranchPayload());
    const branchId = branch.body.data.id as string;

    const query = {
      period: 'CUSTOM',
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-31T23:59:59.999Z',
      branchId,
      limit: 5,
      includeArchived: true,
    };

    const routes = [
      '/api/v1/analytics/company',
      '/api/v1/analytics/transactions',
      '/api/v1/analytics/trips',
      '/api/v1/analytics/expenses',
      '/api/v1/analytics/workforce',
      '/api/v1/analytics/organization',
    ];

    for (const route of routes) {
      const response = await request(app).get(route).query(query).set(owner.auth);
      expect(response.status).toBe(200);
      expect(response.body.data.appliedFilters).toMatchObject({
        period: 'CUSTOM',
        branchId,
        includeArchived: true,
      });
      expect(new Date(response.body.data.appliedFilters.from).toISOString()).toBe(
        '2026-01-01T00:00:00.000Z',
      );
      expect(new Date(response.body.data.appliedFilters.to).toISOString()).toBe(
        '2026-01-31T23:59:59.999Z',
      );
    }
  });
});
