import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext } from '../../setup/test-app.js';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';

describe('Attendance dashboard API', () => {
  it('shows all employees with today quick details for owner and manager', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const present = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
      'present@scrappy.test',
    );
    await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
      'absent@scrappy.test',
    );

    await request(app).post('/api/v1/workforce/attendance/time-in').set(present.auth);

    const dashboard = await request(app)
      .get('/api/v1/workforce/attendance/dashboard')
      .set(owner.auth);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.data.summary.totalEmployees).toBeGreaterThanOrEqual(2);
    expect(dashboard.body.data.summary.timedIn).toBeGreaterThanOrEqual(1);
    expect(dashboard.body.data.summary.absent).toBeGreaterThanOrEqual(1);

    const presentRow = dashboard.body.data.employees.find(
      (row: { employeeId: string }) => row.employeeId === present.employeeId,
    );
    expect(presentRow.isTimedIn).toBe(true);
    expect(presentRow.isAbsent).toBe(false);
    expect(presentRow.timeInToday).toBeTruthy();
  });

  it('rejects employee access to attendance dashboard', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );

    const response = await request(app)
      .get('/api/v1/workforce/attendance/dashboard')
      .set(employee.auth);
    expect(response.status).toBe(403);
  });
});
