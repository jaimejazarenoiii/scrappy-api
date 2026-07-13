import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeEmployeePayload } from '../../factories/employee.factory.js';
import { createCompanyAndLogin, createManagerUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('employee system access api', () => {
  it('grants, disables, and enables system access', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const create = await request(app)
      .post('/api/v1/employees')
      .set(owner.auth)
      .send(makeEmployeePayload({ firstName: 'Grant', lastName: 'Me' }));
    const employeeId = create.body.data.id as string;

    const grant = await request(app)
      .post(`/api/v1/employees/${employeeId}/system-access`)
      .set(owner.auth)
      .send({
        email: 'grantme@scrappy.test',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'EMPLOYEE',
      });
    expect(grant.status).toBe(201);
    expect(grant.body.data.linkedUser.status).toBe('ACTIVE');

    const loginOk = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'grantme@scrappy.test', password: 'password123' });
    expect(loginOk.status).toBe(200);

    const disable = await request(app)
      .post(`/api/v1/employees/${employeeId}/system-access/disable`)
      .set(owner.auth);
    expect(disable.status).toBe(200);
    expect(disable.body.data.linkedUser.status).toBe('INACTIVE');
    expect(disable.body.data.status).toBe('ACTIVE');

    const loginFail = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'grantme@scrappy.test', password: 'password123' });
    expect(loginFail.status).toBe(409);

    const enable = await request(app)
      .post(`/api/v1/employees/${employeeId}/system-access/enable`)
      .set(owner.auth);
    expect(enable.status).toBe(200);
    expect(enable.body.data.linkedUser.status).toBe('ACTIVE');

    const loginAgain = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'grantme@scrappy.test', password: 'password123' });
    expect(loginAgain.status).toBe(200);
  });

  it('rejects grant when employee already has access', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const create = await request(app)
      .post('/api/v1/employees')
      .set(owner.auth)
      .send(
        makeEmployeePayload({
          createAccount: true,
          account: {
            email: 'already@scrappy.test',
            password: 'password123',
            confirmPassword: 'password123',
            role: 'EMPLOYEE',
          },
        }),
      );
    const grant = await request(app)
      .post(`/api/v1/employees/${create.body.data.id}/system-access`)
      .set(owner.auth)
      .send({
        email: 'another@scrappy.test',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'EMPLOYEE',
      });
    expect(grant.status).toBe(409);
  });

  it('rejects manager granting OWNER role', async () => {
    const ctx = createTestContext();
    const owner = await createCompanyAndLogin(ctx.app);
    const manager = await createManagerUser(ctx.app, ctx.userRepository, owner.companyId);
    const create = await request(ctx.app)
      .post('/api/v1/employees')
      .set(owner.auth)
      .send(makeEmployeePayload({ firstName: 'Role', lastName: 'Check' }));
    const grant = await request(ctx.app)
      .post(`/api/v1/employees/${create.body.data.id}/system-access`)
      .set(manager.auth)
      .send({
        email: 'ownerrole@scrappy.test',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'OWNER',
      });
    expect(grant.status).toBe(403);
  });
});
