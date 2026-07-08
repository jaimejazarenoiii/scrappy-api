import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext } from '../../setup/test-app.js';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';

describe('Leave dashboard API', () => {
  it('shows pending and today leave summary for owner', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );

    const leaveRequest = await request(app)
      .post('/api/v1/workforce/leave')
      .set(employee.auth)
      .send({
        leaveType: 'FULL_DAY',
        leaveDate: '2026-07-08',
        reason: 'Family event',
      });
    expect(leaveRequest.status).toBe(201);

    const dashboard = await request(app)
      .get('/api/v1/workforce/leave/dashboard')
      .query({ date: '2026-07-08' })
      .set(owner.auth);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.data.summary.pendingRequests).toBeGreaterThanOrEqual(1);

    const employeeRow = dashboard.body.data.employees.find(
      (row: { employeeId: string }) => row.employeeId === employee.employeeId,
    );
    expect(employeeRow.pendingRequests).toBe(1);
    expect(employeeRow.pendingLeave).toHaveLength(1);
  });

  it('rejects employee access to leave dashboard', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );

    const response = await request(app).get('/api/v1/workforce/leave/dashboard').set(employee.auth);
    expect(response.status).toBe(403);
  });
});
