import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('trip list api', () => {
  it('returns paginated empty list for owner', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    const response = await request(app)
      .get('/api/v1/trips')
      .query({ page: 1, limit: 10, sortBy: 'scheduledStartAt', sortOrder: 'desc' })
      .set(owner.auth);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual([]);
    expect(response.body.meta).toMatchObject({ page: 1, limit: 10, total: 0, totalPages: 0 });
  });

  it('denies employees', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );

    const response = await request(app)
      .get('/api/v1/trips')
      .query({ page: 1, limit: 10 })
      .set(employee.auth);

    expect(response.status).toBe(403);
  });
});
