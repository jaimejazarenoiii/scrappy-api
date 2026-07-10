import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftExpense, setupExpenseActors } from '../../setup/expense-helpers.js';

describe('expense categories api', () => {
  it('returns default categories without treating categories as an expense id', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupExpenseActors(app, userRepository, employeeRepository);

    const response = await request(app).get('/api/v1/expenses/categories').set(employee.auth);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toContain('Fuel');
    expect(response.body.data).toContain('Maintenance');
    expect(response.body.data).toContain('Supplies');
  });

  it('includes distinct categories used by the company', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupExpenseActors(app, userRepository, employeeRepository);

    await createDraftExpense(app, employee.auth, { category: 'Custom Category' });

    const response = await request(app).get('/api/v1/expenses/categories').set(employee.auth);

    expect(response.status).toBe(200);
    expect(response.body.data).toContain('Custom Category');
    expect(response.body.data).toContain('Fuel');
  });
});
