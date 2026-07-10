import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { REPORTS_ROUTES, reportDateRangeQuery } from '../../setup/reports-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('reports auth api', () => {
  it('denies employees on all report list and export routes', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );

    for (const route of REPORTS_ROUTES) {
      const query = route.includes('/export')
        ? `${reportDateRangeQuery()}&format=csv`
        : reportDateRangeQuery();
      const response = await request(app).get(`${route}?${query}`).set(employee.auth);
      expect(response.status).toBe(403);
    }
  });
});
