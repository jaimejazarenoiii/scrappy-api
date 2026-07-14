import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext } from '../../setup/test-app.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createSuperAdminUser, loginAsSuperAdmin } from '../../setup/subscription-helpers.js';

describe('admin company provisioning API', () => {
  it('creates company then OWNER/MANAGER/EMPLOYEE accounts', async () => {
    const { app, userRepository } = createTestContext();
    const { companyId: hostCompanyId } = await createCompanyAndLogin(app);
    await createSuperAdminUser(userRepository, hostCompanyId);
    const adminAuth = await loginAsSuperAdmin(app);

    const created = await request(app)
      .post('/api/v1/admin/companies')
      .set(adminAuth)
      .send({ name: 'Admin Tenant Co', email: 'office@admintenant.test' });
    expect(created.status).toBe(201);
    expect(created.body.data.subscriptionStatus).toBe('TRIAL');
    const companyId = created.body.data.id as string;

    const owner = await request(app)
      .post(`/api/v1/admin/companies/${companyId}/accounts`)
      .set(adminAuth)
      .send({
        firstName: 'Ow',
        lastName: 'Ner',
        weeklySalary: 1000,
        account: {
          email: 'owner@admintenant.test',
          password: 'password123',
          confirmPassword: 'password123',
          role: 'OWNER',
        },
      });
    expect(owner.status).toBe(201);
    expect(owner.body.data.linkedUser.role).toBe('OWNER');

    const manager = await request(app)
      .post(`/api/v1/admin/companies/${companyId}/accounts`)
      .set(adminAuth)
      .send({
        firstName: 'Man',
        lastName: 'Ager',
        weeklySalary: 800,
        account: {
          email: 'manager@admintenant.test',
          password: 'password123',
          confirmPassword: 'password123',
          role: 'MANAGER',
        },
      });
    expect(manager.status).toBe(201);
    expect(manager.body.data.linkedUser.role).toBe('MANAGER');

    const employee = await request(app)
      .post(`/api/v1/admin/companies/${companyId}/accounts`)
      .set(adminAuth)
      .send({
        firstName: 'Emp',
        lastName: 'Loyee',
        weeklySalary: 500,
        account: {
          email: 'employee@admintenant.test',
          password: 'password123',
          confirmPassword: 'password123',
          role: 'EMPLOYEE',
        },
      });
    expect(employee.status).toBe(201);
    expect(employee.body.data.linkedUser.role).toBe('EMPLOYEE');

    const accounts = await request(app)
      .get(`/api/v1/admin/companies/${companyId}/accounts`)
      .set(adminAuth);
    expect(accounts.status).toBe(200);
    expect(accounts.body.data).toHaveLength(3);
    expect(accounts.body.data.map((a: { email: string }) => a.email).sort()).toEqual([
      'employee@admintenant.test',
      'manager@admintenant.test',
      'owner@admintenant.test',
    ]);

    const ownerUserId = accounts.body.data.find(
      (a: { email: string }) => a.email === 'owner@admintenant.test',
    ).userId as string;
    const reset = await request(app)
      .post(`/api/v1/admin/companies/${companyId}/accounts/${ownerUserId}/password-reset`)
      .set(adminAuth)
      .send({ temporaryPassword: 'TempPass99!' });
    expect(reset.status).toBe(200);
    expect(reset.body.data.passwordChangeRequired).toBe(true);

    const loginTemp = await request(app).post('/api/v1/auth/login').send({
      identifier: 'owner@admintenant.test',
      password: 'TempPass99!',
    });
    expect(loginTemp.status).toBe(200);
    expect(loginTemp.body.data.user.passwordChangeRequired).toBe(true);

    const list = await request(app).get('/api/v1/admin/companies').set(adminAuth);
    expect(list.status).toBe(200);
    expect(list.body.data.some((c: { id: string }) => c.id === companyId)).toBe(true);

    const detail = await request(app).get(`/api/v1/admin/companies/${companyId}`).set(adminAuth);
    expect(detail.status).toBe(200);
    expect(detail.body.data.name).toBe('Admin Tenant Co');
  });

  it('returns 404 when creating account for missing company', async () => {
    const { app, userRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    await createSuperAdminUser(userRepository, companyId);
    const adminAuth = await loginAsSuperAdmin(app);

    const missing = await request(app)
      .post('/api/v1/admin/companies/00000000-0000-4000-8000-000000000099/accounts')
      .set(adminAuth)
      .send({
        firstName: 'X',
        lastName: 'Y',
        weeklySalary: 1,
        account: {
          email: 'x@y.test',
          password: 'password123',
          confirmPassword: 'password123',
          role: 'EMPLOYEE',
        },
      });
    expect(missing.status).toBe(404);
  });

  it('forbids OWNER from admin company APIs', async () => {
    const { app } = createTestContext();
    const { auth } = await createCompanyAndLogin(app);
    const res = await request(app).post('/api/v1/admin/companies').set(auth).send({ name: 'Nope' });
    expect(res.status).toBe(403);
  });
});
