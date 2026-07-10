import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftExpense, setupExpenseActors } from '../../setup/expense-helpers.js';

describe('expense by number api', () => {
  it('returns expense by exact expense number', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupExpenseActors(app, userRepository, employeeRepository);

    const created = await createDraftExpense(app, employee.auth);
    const expenseNumber = created.body.data.expenseNumber as string;

    const response = await request(app)
      .get(`/api/v1/expenses/by-number/${expenseNumber}`)
      .set(owner.auth);

    expect(response.status).toBe(200);
    expect(response.body.data.expenseNumber).toBe(expenseNumber);
  });

  it('filters company list by partial expense number', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupExpenseActors(app, userRepository, employeeRepository);

    const created = await createDraftExpense(app, employee.auth);
    const prefix = (created.body.data.expenseNumber as string).slice(0, 12);

    const response = await request(app)
      .get(`/api/v1/expenses?expenseNumber=${prefix}`)
      .set(owner.auth);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
