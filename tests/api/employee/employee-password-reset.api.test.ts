import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
  createCompanyAndLogin,
  createLinkedEmployeeUser,
  createLinkedManagerUser,
  createManagerUser,
} from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('POST /api/v1/employees/:employeeId/password-reset', () => {
  it('resets with system-generated one-time temporary password', async () => {
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
    expect(reset.status).toBe(200);
    expect(reset.body.data.passwordChangeRequired).toBe(true);
    expect(typeof reset.body.data.temporaryPassword).toBe('string');
    expect(reset.body.data.temporaryPassword.length).toBeGreaterThanOrEqual(8);

    const temp = reset.body.data.temporaryPassword as string;

    const oldLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'employee@scrappy.test', password: 'password123' });
    expect(oldLogin.status).toBe(401);

    const tempLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'employee@scrappy.test', password: temp });
    expect(tempLogin.status).toBe(200);
    expect(tempLogin.body.data.user.passwordChangeRequired).toBe(true);

    const status = await request(app)
      .get('/api/v1/users/me/password-status')
      .set({ Authorization: `Bearer ${tempLogin.body.data.accessToken}` });
    expect(status.status).toBe(200);
    expect(status.body.data.passwordChangeRequired).toBe(true);
    expect(status.body.data).not.toHaveProperty('temporaryPassword');
  });

  it('rejects client-supplied password fields', async () => {
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
      .send({ temporaryPassword: 'client-temp' });
    expect(reset.status).toBe(400);
  });

  it('forbids Manager resetting Manager', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    const managerActor = await createManagerUser(app, userRepository, companyId);
    const linkedManager = await createLinkedManagerUser(
      app,
      userRepository,
      employeeRepository,
      companyId,
      'target-manager@scrappy.test',
    );

    const reset = await request(app)
      .post(`/api/v1/employees/${linkedManager.employeeId}/password-reset`)
      .set(managerActor.auth)
      .send({});
    expect(reset.status).toBe(403);
  });

  it('returns 409 when employee has no linked user', async () => {
    const { app } = createTestContext();
    const { auth } = await createCompanyAndLogin(app);
    const created = await request(app)
      .post('/api/v1/employees')
      .set(auth)
      .send({ firstName: 'No', lastName: 'Login', weeklySalary: 1000 });
    expect(created.status).toBe(201);

    const reset = await request(app)
      .post(`/api/v1/employees/${created.body.data.id}/password-reset`)
      .set(auth)
      .send({});
    expect(reset.status).toBe(409);
  });
});
