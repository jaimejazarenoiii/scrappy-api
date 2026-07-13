import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
  createCompanyAndLogin,
  createEmployeeUser,
  createManagerUser,
  loginAsEmployee,
} from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('activity log list/get api', () => {
  it('allows owner and manager to list and get logs; denies employee', async () => {
    const { app, userRepository, activityLogRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const seeded = activityLogRepository.seed({
      companyId: owner.companyId,
      userId: owner.userId,
      action: 'company.updated',
      module: 'company',
      eventType: 'COMPANY',
      description: 'Company updated',
    });

    const ownerList = await request(app).get('/api/v1/activity-logs').set(owner.auth);
    expect(ownerList.status).toBe(200);
    expect(ownerList.body.data.some((row: { id: string }) => row.id === seeded.id)).toBe(true);

    const ownerGet = await request(app).get(`/api/v1/activity-logs/${seeded.id}`).set(owner.auth);
    expect(ownerGet.status).toBe(200);
    expect(ownerGet.body.data.id).toBe(seeded.id);

    const manager = await createManagerUser(app, userRepository, owner.companyId);
    const managerList = await request(app).get('/api/v1/activity-logs').set(manager.auth);
    expect(managerList.status).toBe(200);

    await createEmployeeUser(userRepository, owner.companyId);
    const employeeAuth = await loginAsEmployee(app);
    const employeeList = await request(app).get('/api/v1/activity-logs').set(employeeAuth);
    expect(employeeList.status).toBe(403);
  });
});
