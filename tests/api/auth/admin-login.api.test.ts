import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext } from '../../setup/test-app.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createSuperAdminUser } from '../../setup/subscription-helpers.js';
import { CompanyEntity } from '../../../src/modules/company/domain/company.entity.js';
import { UserEntity } from '../../../src/modules/user/domain/user.entity.js';

describe('admin auth login API', () => {
  it('logs in SUPER_ADMIN and returns tokens', async () => {
    const { app, userRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    await createSuperAdminUser(userRepository, companyId);

    const login = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ identifier: 'superadmin@scrappy.test', password: 'password123' });

    expect(login.status).toBe(200);
    expect(login.body.data.accessToken).toBeTruthy();
    expect(login.body.data.refreshToken).toBeTruthy();
    expect(login.body.data.user.role).toBe('SUPER_ADMIN');
  });

  it('rejects tenant OWNER on admin login with invalid credentials', async () => {
    const { app } = createTestContext();
    await createCompanyAndLogin(app);

    const login = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ identifier: 'owner@scrappy.test', password: 'password123' });

    expect(login.status).toBe(401);
    expect(login.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects wrong password with invalid credentials', async () => {
    const { app, userRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    await createSuperAdminUser(userRepository, companyId);

    const login = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ identifier: 'superadmin@scrappy.test', password: 'wrongpass1' });

    expect(login.status).toBe(401);
    expect(login.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('allows SUPER_ADMIN login when company subscription is EXPIRED', async () => {
    const { app, companyRepository, userRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    const company = companyRepository.companies.get(companyId)!;
    companyRepository.companies.set(
      companyId,
      CompanyEntity.create({ ...company.toPrimitives(), subscriptionStatus: 'EXPIRED' }),
    );
    await createSuperAdminUser(userRepository, companyId);

    const login = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ identifier: 'superadmin@scrappy.test', password: 'password123' });

    expect(login.status).toBe(200);
    expect(login.body.data.user.role).toBe('SUPER_ADMIN');
  });

  it('allows SUPER_ADMIN login when host company is INACTIVE', async () => {
    const { app, companyRepository, userRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    const company = companyRepository.companies.get(companyId)!;
    companyRepository.companies.set(
      companyId,
      CompanyEntity.create({ ...company.toPrimitives(), status: 'INACTIVE' }),
    );
    await createSuperAdminUser(userRepository, companyId);

    const login = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ identifier: 'superadmin@scrappy.test', password: 'password123' });

    expect(login.status).toBe(200);
  });

  it('rejects inactive SUPER_ADMIN', async () => {
    const { app, userRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    await createSuperAdminUser(userRepository, companyId);
    const admin = [...userRepository.users.values()].find((u) => u.role === 'SUPER_ADMIN')!;
    userRepository.users.set(
      admin.id,
      UserEntity.create({ ...admin.toPrimitives(), status: 'INACTIVE' }),
    );

    const login = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ identifier: 'superadmin@scrappy.test', password: 'password123' });

    expect(login.status).toBe(409);
    expect(login.body.error.code).toBe('LIFECYCLE_CONFLICT');
  });

  it('admin token can call SUPER_ADMIN subscription APIs', async () => {
    const { app, userRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    await createSuperAdminUser(userRepository, companyId);

    const login = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({ identifier: 'superadmin@scrappy.test', password: 'password123' });

    const status = await request(app)
      .get(`/api/v1/admin/companies/${companyId}/subscription-status`)
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);

    expect(status.status).toBe(200);
  });
});
