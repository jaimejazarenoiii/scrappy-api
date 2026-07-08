import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeLeavePayload } from '../../factories/leave.factory.js';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('leave request api', () => {
  it('creates leave and rejects duplicate same date', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { auth, companyId } = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      companyId,
      'worker@scrappy.test',
    );

    const create = await request(app)
      .post('/api/v1/workforce/leave')
      .set(employee.auth)
      .send(makeLeavePayload());
    expect(create.status).toBe(201);

    const duplicate = await request(app)
      .post('/api/v1/workforce/leave')
      .set(employee.auth)
      .send(makeLeavePayload());
    expect(duplicate.status).toBe(409);

    const companyList = await request(app).get('/api/v1/workforce/leave/company').set(auth);
    expect(companyList.status).toBe(200);
    expect(companyList.body.data.length).toBeGreaterThanOrEqual(1);
    expect(companyList.body.data[0]).toMatchObject({
      firstName: 'Jane',
      lastName: 'Worker',
      employeeId: employee.employeeId,
    });
  });
});
