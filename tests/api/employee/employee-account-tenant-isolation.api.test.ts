import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeCompanyPayload } from '../../factories/company.factory.js';
import { makeEmployeePayload } from '../../factories/employee.factory.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('employee account tenant isolation api', () => {
  it('blocks cross-company grant and disable', async () => {
    const ctxA = createTestContext();
    const ownerA = await createCompanyAndLogin(ctxA.app);
    const createA = await request(ctxA.app)
      .post('/api/v1/employees')
      .set(ownerA.auth)
      .send(makeEmployeePayload({ firstName: 'Company', lastName: 'A' }));
    const employeeA = createA.body.data.id as string;

    const ctxB = createTestContext();
    await request(ctxB.app)
      .post('/api/v1/companies')
      .send(
        makeCompanyPayload({
          name: `Scrappy B ${randomUUID()}`,
          ownerEmail: 'owner-b@scrappy.test',
        }),
      );
    const loginB = await request(ctxB.app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'owner-b@scrappy.test', password: 'password123' });
    const authB = { Authorization: `Bearer ${loginB.body.data.accessToken}` };

    // Company B token against Company A's employee id on Company B app — employee won't exist
    const grant = await request(ctxB.app)
      .post(`/api/v1/employees/${employeeA}/system-access`)
      .set(authB)
      .send({
        email: 'cross@scrappy.test',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'EMPLOYEE',
      });
    expect(grant.status).toBe(404);

    const disable = await request(ctxB.app)
      .post(`/api/v1/employees/${employeeA}/system-access/disable`)
      .set(authB);
    expect(disable.status).toBe(404);
  });
});
