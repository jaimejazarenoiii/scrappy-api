import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext } from '../../setup/test-app.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createSuperAdminUser } from '../../setup/subscription-helpers.js';
import { CompanyEntity } from '../../../src/modules/company/domain/company.entity.js';

describe('subscription login gate API', () => {
  it('allows owner login when subscription is TRIAL (default)', async () => {
    const { app } = createTestContext();
    await createCompanyAndLogin(app);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'owner@scrappy.test', password: 'password123' });
    expect(login.status).toBe(200);
  });

  it('denies owner login when subscription is EXPIRED', async () => {
    const { app, companyRepository } = createTestContext();
    await createCompanyAndLogin(app);
    const company = [...companyRepository.companies.values()][0]!;
    companyRepository.companies.set(
      company.id,
      CompanyEntity.create({ ...company.toPrimitives(), subscriptionStatus: 'EXPIRED' }),
    );
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'owner@scrappy.test', password: 'password123' });
    expect(login.status).toBe(409);
    expect(login.body.error.code).toBe('SUBSCRIPTION_INACTIVE');
  });

  it('denies owner login when subscription is SUSPENDED', async () => {
    const { app, companyRepository } = createTestContext();
    await createCompanyAndLogin(app);
    const company = [...companyRepository.companies.values()][0]!;
    companyRepository.companies.set(
      company.id,
      CompanyEntity.create({ ...company.toPrimitives(), subscriptionStatus: 'SUSPENDED' }),
    );
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'owner@scrappy.test', password: 'password123' });
    expect(login.status).toBe(409);
    expect(login.body.error.code).toBe('SUBSCRIPTION_INACTIVE');
  });

  it('allows GRACE_PERIOD login', async () => {
    const { app, companyRepository } = createTestContext();
    await createCompanyAndLogin(app);
    const company = [...companyRepository.companies.values()][0]!;
    companyRepository.companies.set(
      company.id,
      CompanyEntity.create({ ...company.toPrimitives(), subscriptionStatus: 'GRACE_PERIOD' }),
    );
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'owner@scrappy.test', password: 'password123' });
    expect(login.status).toBe(200);
  });

  it('rejects SUPER_ADMIN on tenant login with invalid credentials', async () => {
    const { app, userRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    await createSuperAdminUser(userRepository, companyId);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'superadmin@scrappy.test', password: 'password123' });
    expect(login.status).toBe(401);
    expect(login.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});
