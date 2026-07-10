import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createManagerUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftExpense, setupExpenseActors } from '../../setup/expense-helpers.js';

describe('expense list api', () => {
  it('returns paginated company expenses sorted by expenseDate desc for manager', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupExpenseActors(app, userRepository, employeeRepository);

    const older = await createDraftExpense(app, employee.auth, {
      expenseDate: new Date('2026-07-01T08:00:00.000Z').toISOString(),
      category: 'Older',
    });
    const newer = await createDraftExpense(app, employee.auth, {
      expenseDate: new Date('2026-07-09T12:00:00.000Z').toISOString(),
      category: 'Newer',
    });
    expect(older.status).toBe(201);
    expect(newer.status).toBe(201);

    const manager = await createManagerUser(app, userRepository, owner.companyId);
    const response = await request(app)
      .get('/api/v1/expenses?page=1&limit=10&sortBy=expenseDate&sortOrder=desc')
      .set(manager.auth);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    expect(response.body.meta.total).toBeGreaterThanOrEqual(2);
    expect(new Date(response.body.data[0].expenseDate).getTime()).toBeGreaterThanOrEqual(
      new Date(response.body.data[1].expenseDate).getTime(),
    );
  });

  it('filters expenses by status', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupExpenseActors(app, userRepository, employeeRepository);
    const draft = await createDraftExpense(app, employee.auth);
    const expenseId = draft.body.data.id as string;

    const manager = await createManagerUser(app, userRepository, owner.companyId);
    await request(app).post(`/api/v1/expenses/${expenseId}/record`).set(employee.auth);

    const recordedOnly = await request(app)
      .get('/api/v1/expenses?status=RECORDED')
      .set(manager.auth);
    expect(recordedOnly.status).toBe(200);
    expect(
      recordedOnly.body.data.every((row: { status: string }) => row.status === 'RECORDED'),
    ).toBe(true);
  });
});
