import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../setup/test-app.js';
import {
  buildExpensePayload,
  createDraftExpense,
  setupExpenseActors,
} from '../../setup/expense-helpers.js';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';

describe('expense create api', () => {
  it('creates a draft expense with expense number for timed-in employee', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupExpenseActors(app, userRepository, employeeRepository);

    const response = await createDraftExpense(app, employee.auth);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('DRAFT');
    expect(response.body.data.expenseNumber).toMatch(/^EXP-\d{8}-\d{6}$/);
    expect(response.body.data.category).toBe('Fuel');
    expect(response.body.data.amount).toBe(1500);
  });

  it('rejects employee create when not timed in', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
      'notimed@scrappy.test',
    );

    const response = await createDraftExpense(app, employee.auth);
    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('allows manager to create without timed in', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner } = await setupExpenseActors(app, userRepository, employeeRepository);

    const response = await request(app)
      .post('/api/v1/expenses')
      .set(owner.auth)
      .send(buildExpensePayload({ recordImmediately: true }));

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('RECORDED');
    expect(response.body.data.recordedAt).toBeTruthy();
  });
});
