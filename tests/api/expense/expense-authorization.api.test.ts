import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createManagerUser, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftExpense, setupExpenseActors } from '../../setup/expense-helpers.js';

describe('expense authorization api', () => {
  it('denies employee access to company expense list', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupExpenseActors(app, userRepository, employeeRepository);
    await createDraftExpense(app, employee.auth);

    const response = await request(app).get('/api/v1/expenses').set(employee.auth);
    expect(response.status).toBe(403);
  });

  it('allows employee to list own expenses via /mine', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupExpenseActors(app, userRepository, employeeRepository);
    await createDraftExpense(app, employee.auth);

    const response = await request(app).get('/api/v1/expenses/mine').set(employee.auth);
    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('denies employee from viewing another employees expense', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupExpenseActors(app, userRepository, employeeRepository);
    const created = await createDraftExpense(app, employee.auth);
    const expenseId = created.body.data.id as string;

    const otherEmployee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
      'other-employee@scrappy.test',
    );
    const response = await request(app)
      .get(`/api/v1/expenses/${expenseId}`)
      .set(otherEmployee.auth);
    expect(response.status).toBe(403);
  });

  it('allows manager to archive recorded expense and blocks employee archive', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupExpenseActors(app, userRepository, employeeRepository);
    const created = await createDraftExpense(app, employee.auth);
    const expenseId = created.body.data.id as string;
    await request(app).post(`/api/v1/expenses/${expenseId}/record`).set(employee.auth);

    const employeeArchive = await request(app)
      .post(`/api/v1/expenses/${expenseId}/archive`)
      .set(employee.auth)
      .send({});
    expect(employeeArchive.status).toBe(403);

    const manager = await createManagerUser(app, userRepository, owner.companyId);
    const managerArchive = await request(app)
      .post(`/api/v1/expenses/${expenseId}/archive`)
      .set(manager.auth)
      .send({});
    expect(managerArchive.status).toBe(200);
    expect(managerArchive.body.data.deletedAt).toBeTruthy();
  });
});
