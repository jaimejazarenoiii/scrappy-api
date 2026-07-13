import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('activity log event generation api', () => {
  it('records auth.login and employee.created activity logs', async () => {
    const { app, activityLogRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(
      activityLogRepository.items.some(
        (item) => item.companyId === owner.companyId && item.action === 'auth.login',
      ),
    ).toBe(true);

    const createEmployee = await request(app).post('/api/v1/employees').set(owner.auth).send({
      firstName: 'Ada',
      lastName: 'Lovelace',
      weeklySalary: 5000,
    });
    expect(createEmployee.status).toBe(201);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(
      activityLogRepository.items.some(
        (item) => item.companyId === owner.companyId && item.action === 'employee.created',
      ),
    ).toBe(true);
  });
});
