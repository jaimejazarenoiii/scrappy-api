import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeCashAdvancePayload } from '../../factories/cash-advance.factory.js';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('cash advance api', () => {
  it('allows manager create and employee read own only', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { auth, companyId } = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      companyId,
      'worker2@scrappy.test',
    );

    const create = await request(app)
      .post('/api/v1/workforce/cash-advances')
      .set(auth)
      .send(makeCashAdvancePayload(employee.employeeId));
    expect(create.status).toBe(201);
    expect(create.body.data.issuedAt).toBeTruthy();

    const backdated = await request(app)
      .post('/api/v1/workforce/cash-advances')
      .set(auth)
      .send(
        makeCashAdvancePayload(employee.employeeId, {
          amount: 250,
          issuedAt: '2026-07-01T00:00:00.000Z',
        }),
      );
    expect(backdated.status).toBe(201);
    expect(backdated.body.data.issuedAt).toBe('2026-07-01T08:00:00.000+08:00');
    expect(backdated.body.data.amount).toBe(250);

    const employeeDenied = await request(app)
      .post('/api/v1/workforce/cash-advances')
      .set(employee.auth)
      .send(makeCashAdvancePayload(employee.employeeId));
    expect(employeeDenied.status).toBe(403);

    const ownList = await request(app).get('/api/v1/workforce/cash-advances').set(employee.auth);
    expect(ownList.status).toBe(200);
    expect(ownList.body.data.length).toBe(2);
  });
});
