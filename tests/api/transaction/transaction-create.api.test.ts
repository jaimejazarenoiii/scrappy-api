import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('transaction create api', () => {
  it('lets a timed-in employee create a draft and retrieve it', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);

    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    expect(create.status).toBe(201);
    expect(create.body.data.status).toBe('DRAFT');
    expect(create.body.data.transactionNumber).toMatch(/^IN-\d{8}-\d{6}$/);
    expect(create.body.data.items).toHaveLength(1);
    expect(create.body.data.assignedEmployeeIds).toContain(employee.employeeId);

    const transactionId = create.body.data.id as string;
    const get = await request(app).get(`/api/v1/transactions/${transactionId}`).set(employee.auth);
    expect(get.status).toBe(200);
    expect(get.body.data.id).toBe(transactionId);
    expect(get.body.data.totalAmount).toBe(2500);
  });

  it('rejects creation when the employee is not timed in', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      companyId,
    );

    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    expect(create.status).toBe(409);
  });

  it('rejects an invalid branch location payload', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);

    const create = await request(app)
      .post('/api/v1/transactions')
      .set(employee.auth)
      .send({
        direction: 'INBOUND',
        partyName: 'Acme',
        locationType: 'BRANCH',
        assignedEmployeeIds: [employee.employeeId],
        items: [{ materialName: 'Copper', weight: 10, unit: 'KG', price: 250 }],
      });
    expect(create.status).toBe(400);
  });

  it('requires authentication', async () => {
    const { app } = createTestContext();
    const create = await request(app).post('/api/v1/transactions').send({ partyName: 'Acme' });
    expect(create.status).toBe(401);
  });
});
