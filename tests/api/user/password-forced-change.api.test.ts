import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('Forced password change after admin reset', () => {
  it('blocks protected routes until password is changed', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { auth, companyId } = await createCompanyAndLogin(app);
    const linked = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      companyId,
    );

    const reset = await request(app)
      .post(`/api/v1/employees/${linked.employeeId}/password-reset`)
      .set(auth)
      .send({});
    const temp = reset.body.data.temporaryPassword as string;

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'employee@scrappy.test', password: temp });
    const employeeAuth = { Authorization: `Bearer ${login.body.data.accessToken}` };

    const blocked = await request(app).get('/api/v1/employees').set(employeeAuth);
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED');

    const status = await request(app).get('/api/v1/users/me/password-status').set(employeeAuth);
    expect(status.status).toBe(200);
    expect(status.body.data.passwordChangeRequired).toBe(true);

    const change = await request(app).post('/api/v1/users/me/password').set(employeeAuth).send({
      currentPassword: temp,
      newPassword: 'finalpass1',
      confirmPassword: 'finalpass1',
    });
    expect(change.status).toBe(200);

    const relogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'employee@scrappy.test', password: 'finalpass1' });
    expect(relogin.status).toBe(200);
    expect(relogin.body.data.user.passwordChangeRequired).toBe(false);

    const allowed = await request(app)
      .get('/api/v1/employees')
      .set({ Authorization: `Bearer ${relogin.body.data.accessToken}` });
    expect(allowed.status).toBe(200);

    const tempAgain = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'employee@scrappy.test', password: temp });
    expect(tempAgain.status).toBe(401);
  });
});
