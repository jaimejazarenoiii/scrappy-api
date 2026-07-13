import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('Password session revoke', () => {
  it('revokes refresh sessions after admin reset', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { auth, companyId } = await createCompanyAndLogin(app);
    const linked = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      companyId,
    );

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'employee@scrappy.test', password: 'password123' });
    const refreshToken = login.body.data.refreshToken as string;

    await request(app)
      .post(`/api/v1/employees/${linked.employeeId}/password-reset`)
      .set(auth)
      .send({});

    const refresh = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(refresh.status).toBe(401);
  });

  it('revokes refresh sessions after change password', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    const linked = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      companyId,
    );

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'employee@scrappy.test', password: 'password123' });
    const refreshToken = login.body.data.refreshToken as string;
    const accessAuth = { Authorization: `Bearer ${login.body.data.accessToken}` };

    await request(app).post('/api/v1/users/me/password').set(accessAuth).send({
      currentPassword: 'password123',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    });

    const refresh = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(refresh.status).toBe(401);
    expect(linked.userId).toBeTruthy();
  });
});
