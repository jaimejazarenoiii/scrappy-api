import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createManagerUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftExpense, setupExpenseActors } from '../../setup/expense-helpers.js';

describe('expense update and record api', () => {
  it('allows employee to update own draft and record it', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupExpenseActors(app, userRepository, employeeRepository);

    const created = await createDraftExpense(app, employee.auth);
    const expenseId = created.body.data.id as string;

    const updated = await request(app)
      .patch(`/api/v1/expenses/${expenseId}`)
      .set(employee.auth)
      .send({ category: 'Toll Fees', amount: 200 });

    expect(updated.status).toBe(200);
    expect(updated.body.data.category).toBe('Toll Fees');
    expect(updated.body.data.amount).toBe(200);

    const recorded = await request(app)
      .post(`/api/v1/expenses/${expenseId}/record`)
      .set(employee.auth);

    expect(recorded.status).toBe(200);
    expect(recorded.body.data.status).toBe('RECORDED');

    const blocked = await request(app)
      .patch(`/api/v1/expenses/${expenseId}`)
      .set(employee.auth)
      .send({ description: 'Should fail' });

    expect(blocked.status).toBe(409);
  });

  it('allows manager to update recorded expense', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupExpenseActors(app, userRepository, employeeRepository);
    const created = await createDraftExpense(app, employee.auth);
    const expenseId = created.body.data.id as string;

    await request(app).post(`/api/v1/expenses/${expenseId}/record`).set(employee.auth);

    const manager = await createManagerUser(app, userRepository, owner.companyId);
    const updated = await request(app)
      .patch(`/api/v1/expenses/${expenseId}`)
      .set(manager.auth)
      .send({ description: 'Manager corrected description' });

    expect(updated.status).toBe(200);
    expect(updated.body.data.description).toBe('Manager corrected description');
  });
});
