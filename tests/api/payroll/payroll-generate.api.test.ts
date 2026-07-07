import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeCashAdvancePayload } from '../../factories/cash-advance.factory.js';
import { makePayrollPayload } from '../../factories/payroll.factory.js';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('payroll api', () => {
  it('generates payroll with deductions and marks paid', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { auth, companyId } = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      companyId,
      'payroll@scrappy.test',
    );

    await request(app)
      .post('/api/v1/workforce/cash-advances')
      .set(auth)
      .send(makeCashAdvancePayload(employee.employeeId, { amount: 500 }));

    const generate = await request(app)
      .post('/api/v1/workforce/payroll')
      .set(auth)
      .send(makePayrollPayload());
    expect(generate.status).toBe(201);
    expect(generate.body.data.items.length).toBeGreaterThanOrEqual(1);

    const payrollId = generate.body.data.items[0].id as string;
    const detail = await request(app).get(`/api/v1/workforce/payroll/${payrollId}`).set(auth);
    expect(detail.status).toBe(200);
    expect(detail.body.data.cashAdvanceDeductions).toBe(500);
    expect(detail.body.data.netPay).toBe(3000);

    const markPaid = await request(app)
      .post(`/api/v1/workforce/payroll/${payrollId}/mark-paid`)
      .set(auth);
    expect(markPaid.status).toBe(200);
    expect(markPaid.body.data.status).toBe('PAID');

    const alreadyPaid = await request(app)
      .post(`/api/v1/workforce/payroll/${payrollId}/mark-paid`)
      .set(auth);
    expect(alreadyPaid.status).toBe(409);
  });
});
