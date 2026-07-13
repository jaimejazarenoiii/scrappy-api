import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeEmployeePayload } from '../../factories/employee.factory.js';
import { createCompanyAndLogin, createManagerUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('employee create with optional account api', () => {
  it('creates employee without account', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const create = await request(app)
      .post('/api/v1/employees')
      .set(owner.auth)
      .send(makeEmployeePayload({ createAccount: false }));
    expect(create.status).toBe(201);
    expect(create.body.data.userId).toBeNull();
    expect(create.body.data.linkedUser).toBeNull();
  });

  it('creates employee with account and allows login', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const email = 'newhire@scrappy.test';
    const create = await request(app)
      .post('/api/v1/employees')
      .set(owner.auth)
      .send(
        makeEmployeePayload({
          createAccount: true,
          account: {
            email,
            password: 'password123',
            confirmPassword: 'password123',
            role: 'EMPLOYEE',
          },
        }),
      );
    expect(create.status).toBe(201);
    expect(create.body.data.linkedUser.email).toBe(email);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: email, password: 'password123' });
    expect(login.status).toBe(200);
    expect(login.body.data.accessToken).toBeTruthy();
  });

  it('rejects password mismatch', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const create = await request(app)
      .post('/api/v1/employees')
      .set(owner.auth)
      .send(
        makeEmployeePayload({
          createAccount: true,
          account: {
            email: 'mismatch@scrappy.test',
            password: 'password123',
            confirmPassword: 'password999',
            role: 'EMPLOYEE',
          },
        }),
      );
    expect(create.status).toBe(400);
  });

  it('rejects manager assigning manager role', async () => {
    const ctx = createTestContext();
    const owner = await createCompanyAndLogin(ctx.app);
    const manager = await createManagerUser(ctx.app, ctx.userRepository, owner.companyId);
    const create = await request(ctx.app)
      .post('/api/v1/employees')
      .set(manager.auth)
      .send(
        makeEmployeePayload({
          createAccount: true,
          account: {
            email: 'mgr2@scrappy.test',
            password: 'password123',
            confirmPassword: 'password123',
            role: 'MANAGER',
          },
        }),
      );
    expect(create.status).toBe(403);
  });
});
