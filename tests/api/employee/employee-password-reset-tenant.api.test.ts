import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeCompanyPayload } from '../../factories/company.factory.js';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('Password reset tenant isolation', () => {
  it('cannot reset employee from another company', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const companyA = await createCompanyAndLogin(app);
    const linkedA = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      companyA.companyId,
    );

    await request(app)
      .post('/api/v1/companies')
      .send(makeCompanyPayload({ name: 'Other Co', ownerEmail: 'other-owner@scrappy.test' }));
    const loginB = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'other-owner@scrappy.test', password: 'password123' });
    const authB = { Authorization: `Bearer ${loginB.body.data.accessToken}` };

    const reset = await request(app)
      .post(`/api/v1/employees/${linkedA.employeeId}/password-reset`)
      .set(authB)
      .send({});
    expect([403, 404]).toContain(reset.status);
  });
});
