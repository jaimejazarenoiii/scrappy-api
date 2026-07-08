import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { ANALYTICS_ROUTES } from '../../setup/analytics-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('analytics auth api', () => {
  it('denies employees on all analytics dashboards', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );

    for (const route of ANALYTICS_ROUTES) {
      const response = await request(app).get(route).set(employee.auth);
      expect(response.status).toBe(403);
    }
  });

  it('allows owner access to company analytics', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const response = await request(app).get('/api/v1/analytics/company').set(owner.auth);
    expect(response.status).toBe(200);
    expect(response.body.data.appliedFilters.period).toBe('THIS_MONTH');
  });
});
