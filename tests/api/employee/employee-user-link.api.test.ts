import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeCompanyPayload } from '../../factories/company.factory.js';
import { makeEmployeePayload } from '../../factories/employee.factory.js';
import { createTestContext } from '../../setup/test-app.js';

describe('employee user link api', () => {
  it('links an employee to a same-company user', async () => {
    const { app } = createTestContext();
    await request(app).post('/api/v1/companies').send(makeCompanyPayload());
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'owner@scrappy.test', password: 'password123' });
    const auth = { Authorization: `Bearer ${login.body.data.accessToken}` };
    const employee = await request(app)
      .post('/api/v1/employees')
      .set(auth)
      .send(makeEmployeePayload());
    const link = await request(app)
      .post(`/api/v1/employees/${employee.body.data.id}/user-link`)
      .set(auth)
      .send({ userId: login.body.data.user.id });
    expect(link.status).toBe(200);
    expect(link.body.data.userId).toBe(login.body.data.user.id);
  });
});
