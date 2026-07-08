import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeCompanyPayload } from '../../factories/company.factory.js';
import { makeEmployeePayload } from '../../factories/employee.factory.js';
import { createTestContext } from '../../setup/test-app.js';

describe('GET /api/v1/employees/me', () => {
  it('returns the employee profile linked to the current user', async () => {
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
    await request(app)
      .post(`/api/v1/employees/${employee.body.data.id}/user-link`)
      .set(auth)
      .send({ userId: login.body.data.user.id });
    const response = await request(app).get('/api/v1/employees/me').set(auth);
    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(employee.body.data.id);
    expect(response.body.data.userId).toBe(login.body.data.user.id);
  });

  it('returns 404 when the current user has no linked employee', async () => {
    const { app } = createTestContext();
    await request(app).post('/api/v1/companies').send(makeCompanyPayload());
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'owner@scrappy.test', password: 'password123' });
    const response = await request(app)
      .get('/api/v1/employees/me')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect(response.status).toBe(404);
  });
});
