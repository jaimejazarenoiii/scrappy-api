import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeCompanyPayload } from '../../factories/company.factory.js';
import { makeEmployeePayload } from '../../factories/employee.factory.js';
import { createTestContext } from '../../setup/test-app.js';

describe('employee crud api', () => {
  it('creates, reads, and updates an employee', async () => {
    const { app } = createTestContext();
    await request(app).post('/api/v1/companies').send(makeCompanyPayload());
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'owner@scrappy.test', password: 'password123' });
    const auth = { Authorization: `Bearer ${login.body.data.accessToken}` };
    const create = await request(app)
      .post('/api/v1/employees')
      .set(auth)
      .send(makeEmployeePayload());
    expect(create.status).toBe(201);
    const employeeId = create.body.data.id;
    const read = await request(app).get(`/api/v1/employees/${employeeId}`).set(auth);
    expect(read.status).toBe(200);
    const update = await request(app)
      .patch(`/api/v1/employees/${employeeId}`)
      .set(auth)
      .send({ lastName: 'Smith' });
    expect(update.body.data.lastName).toBe('Smith');
  });
});
