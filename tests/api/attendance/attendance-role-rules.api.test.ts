import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext } from '../../setup/test-app.js';
import {
  createCompanyAndLogin,
  createLinkedEmployeeUser,
  createLinkedManagerUser,
} from '../../setup/auth-helpers.js';

describe('Attendance role rules API', () => {
  it('exempts owners from time-in/out and leave while managers must track attendance', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
      'worker@scrappy.test',
    );
    const manager = await createLinkedManagerUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );

    const ownerTimeIn = await request(app)
      .post('/api/v1/workforce/attendance/time-in')
      .set(owner.auth);
    expect(ownerTimeIn.status).toBe(403);

    const ownerLeave = await request(app).post('/api/v1/workforce/leave').set(owner.auth).send({
      leaveType: 'FULL_DAY',
      leaveDate: '2026-07-08',
    });
    expect(ownerLeave.status).toBe(400);

    const ownerLeaveOnBehalf = await request(app)
      .post('/api/v1/workforce/leave')
      .set(owner.auth)
      .send({
        leaveType: 'FULL_DAY',
        leaveDate: '2026-07-09',
        employeeId: employee.employeeId,
      });
    expect(ownerLeaveOnBehalf.status).toBe(201);
    expect(ownerLeaveOnBehalf.body.data.employeeId).toBe(employee.employeeId);

    const ownerStatus = await request(app)
      .get('/api/v1/workforce/attendance/status')
      .set(owner.auth);
    expect(ownerStatus.status).toBe(200);
    expect(ownerStatus.body.data.isTimedIn).toBe(false);

    const ownerDashboard = await request(app).get('/api/v1/workforce/dashboard').set(owner.auth);
    expect(ownerDashboard.status).toBe(200);
    expect(ownerDashboard.body.data.visibility.canTimeIn).toBe(false);
    expect(ownerDashboard.body.data.visibility.canCreateTransaction).toBe(true);

    const managerTimeIn = await request(app)
      .post('/api/v1/workforce/attendance/time-in')
      .set(manager.auth);
    expect(managerTimeIn.status).toBe(200);

    const managerStatus = await request(app)
      .get('/api/v1/workforce/attendance/status')
      .set(manager.auth);
    expect(managerStatus.body.data.isTimedIn).toBe(true);

    await request(app).post('/api/v1/workforce/attendance/time-in').set(employee.auth);
    const employeeStatus = await request(app)
      .get('/api/v1/workforce/attendance/status')
      .set(employee.auth);
    expect(employeeStatus.body.data.isTimedIn).toBe(true);
  });
});
