import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeLeavePayload } from '../../factories/leave.factory.js';
import {
  createCompanyAndLogin,
  createLinkedEmployeeUser,
  createLinkedManagerUser,
} from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('leave manage api', () => {
  it('lets owners and managers create leave on behalf and edit leave details', async () => {
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

    const managerCreate = await request(app)
      .post('/api/v1/workforce/leave')
      .set(manager.auth)
      .send(makeLeavePayload({ employeeId: employee.employeeId, leaveDate: '2026-07-20' }));
    expect(managerCreate.status).toBe(201);
    expect(managerCreate.body.data.employeeId).toBe(employee.employeeId);

    const employeeForbidden = await request(app)
      .post('/api/v1/workforce/leave')
      .set(employee.auth)
      .send(makeLeavePayload({ employeeId: manager.employeeId, leaveDate: '2026-07-21' }));
    expect(employeeForbidden.status).toBe(403);

    const ownerCreate = await request(app)
      .post('/api/v1/workforce/leave')
      .set(owner.auth)
      .send(makeLeavePayload({ employeeId: employee.employeeId, leaveDate: '2026-07-22' }));
    expect(ownerCreate.status).toBe(201);

    const leaveId = ownerCreate.body.data.id as string;
    const updated = await request(app)
      .patch(`/api/v1/workforce/leave/${leaveId}`)
      .set(manager.auth)
      .send({
        status: 'APPROVED',
        leaveType: 'HALF_DAY',
        leaveDate: '2026-07-23',
        reason: 'Adjusted schedule',
        managerNote: 'Approved with changes',
      });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({
      status: 'APPROVED',
      leaveType: 'HALF_DAY',
      reason: 'Adjusted schedule',
      managerNote: 'Approved with changes',
    });
    expect(updated.body.data.leaveDate).toContain('2026-07-23');
  });
});
