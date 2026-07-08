import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeCompanyPayload } from '../../factories/company.factory.js';
import { makeEmployeePayload } from '../../factories/employee.factory.js';
import { createTestContext } from '../../setup/test-app.js';

describe('GET /api/v1/employees', () => {
  it('lists the active employees of the authenticated user company', async () => {
    const { app } = createTestContext();
    await request(app).post('/api/v1/companies').send(makeCompanyPayload());
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'owner@scrappy.test', password: 'password123' });
    const auth = { Authorization: `Bearer ${login.body.data.accessToken}` };
    await request(app).post('/api/v1/employees').set(auth).send(makeEmployeePayload());
    await request(app)
      .post('/api/v1/employees')
      .set(auth)
      .send(makeEmployeePayload({ firstName: 'Second', lastName: 'Worker' }));
    const response = await request(app).get('/api/v1/employees').set(auth);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(2);
  });
});
