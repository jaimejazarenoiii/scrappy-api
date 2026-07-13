import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('POST /api/v1/users/me/password', () => {
  it('changes password and allows login with new credentials only', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    const linked = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      companyId,
    );

    const change = await request(app).post('/api/v1/users/me/password').set(linked.auth).send({
      currentPassword: 'password123',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    });
    expect(change.status).toBe(200);
    expect(change.body.data.passwordChangeRequired).toBe(false);

    const oldLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'employee@scrappy.test', password: 'password123' });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'employee@scrappy.test', password: 'newpass123' });
    expect(newLogin.status).toBe(200);
    expect(newLogin.body.data.user.passwordChangeRequired).toBe(false);
  });

  it('rejects incorrect current password', async () => {
    const { app } = createTestContext();
    const { auth } = await createCompanyAndLogin(app);
    const response = await request(app).post('/api/v1/users/me/password').set(auth).send({
      currentPassword: 'wrong-password',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    });
    expect(response.status).toBe(400);
  });
});
