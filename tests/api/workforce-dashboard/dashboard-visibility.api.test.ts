import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('dashboard visibility api', () => {
  it('reflects visibility before and after time in', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    const { auth } = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      companyId,
      'dash@scrappy.test',
    );

    const before = await request(app).get('/api/v1/workforce/dashboard').set(auth);
    expect(before.status).toBe(200);
    expect(before.body.data.visibility.canTimeIn).toBe(true);
    expect(before.body.data.visibility.canTimeOut).toBe(false);
    expect(before.body.data.visibility.canCreateTransaction).toBe(false);

    await request(app).post('/api/v1/workforce/attendance/time-in').set(auth);

    const during = await request(app).get('/api/v1/workforce/dashboard').set(auth);
    expect(during.body.data.visibility.canTimeOut).toBe(true);
    expect(during.body.data.visibility.canCreateTransaction).toBe(true);
    expect(during.body.data.visibility.canTimeIn).toBe(false);
  });
});
