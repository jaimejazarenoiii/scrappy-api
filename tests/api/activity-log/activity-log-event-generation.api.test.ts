import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('activity log event generation api', () => {
  it('records auth.login and employee.created with actor account tags', async () => {
    const { app, activityLogRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    await new Promise((resolve) => setTimeout(resolve, 20));
    const loginLog = activityLogRepository.items.find(
      (item) => item.companyId === owner.companyId && item.action === 'auth.login',
    );
    expect(loginLog).toBeTruthy();
    expect(loginLog!.userId).toBe(owner.userId);
    expect(loginLog!.metadata).toMatchObject({
      actorEmail: expect.any(String),
      actorRole: 'OWNER',
    });

    const createEmployee = await request(app)
      .post('/api/v1/employees')
      .set(owner.auth)
      .send({
        firstName: 'Ada',
        lastName: 'Lovelace',
        weeklySalary: 5000,
        createAccount: true,
        account: {
          email: 'ada@scrappy.test',
          password: 'password123',
          confirmPassword: 'password123',
          role: 'EMPLOYEE',
        },
      });
    expect(createEmployee.status).toBe(201);
    const createdEmployeeId = createEmployee.body.data.id as string;

    const loginAsAda = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'ada@scrappy.test', password: 'password123' });
    expect(loginAsAda.status).toBe(200);

    await new Promise((resolve) => setTimeout(resolve, 20));
    const adaLogin = activityLogRepository.items.find(
      (item) => item.action === 'auth.login' && item.userId === loginAsAda.body.data.user.id,
    );
    expect(adaLogin?.employeeId).toBe(createdEmployeeId);
    expect(adaLogin!.metadata).toMatchObject({
      actorEmail: 'ada@scrappy.test',
      actorRole: 'EMPLOYEE',
      actorEmployeeId: createdEmployeeId,
    });

    expect(
      activityLogRepository.items.some(
        (item) => item.companyId === owner.companyId && item.action === 'employee.created',
      ),
    ).toBe(true);

    const list = await request(app).get('/api/v1/activity-logs?action=auth.login').set(owner.auth);
    expect(list.status).toBe(200);
    const adaRow = list.body.data.find(
      (row: { userId: string }) => row.userId === loginAsAda.body.data.user.id,
    );
    expect(adaRow.performedBy).toEqual({
      id: loginAsAda.body.data.user.id,
      employeeId: createdEmployeeId,
      email: 'ada@scrappy.test',
      role: 'EMPLOYEE',
    });
  });
});
