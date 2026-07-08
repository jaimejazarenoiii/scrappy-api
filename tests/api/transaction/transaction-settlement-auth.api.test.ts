import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createManagerUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('transaction settlement authorization matrix api', () => {
  it('enforces role permissions for finish, settle, return, reopen, and receipt', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );
    const manager = await createManagerUser(app, userRepository, owner.companyId);

    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const transactionId = create.body.data.id as string;

    const ownerFinish = await request(app)
      .post(`/api/v1/transactions/${transactionId}/finish`)
      .set(owner.auth);
    expect(ownerFinish.status).toBe(200);
    expect(ownerFinish.body.data.status).toBe('READY_FOR_PAYMENT');

    const managerFinish = await request(app)
      .post(`/api/v1/transactions/${transactionId}/finish`)
      .set(manager.auth);
    expect(managerFinish.status).toBe(409);

    const employeeSettle = await request(app)
      .post(`/api/v1/transactions/${transactionId}/settle`)
      .set(employee.auth)
      .send({});
    expect(employeeSettle.status).toBe(403);

    const employeeReturn = await request(app)
      .post(`/api/v1/transactions/${transactionId}/return-to-draft`)
      .set(employee.auth)
      .send({});
    expect(employeeReturn.status).toBe(403);

    const managerReturn = await request(app)
      .post(`/api/v1/transactions/${transactionId}/return-to-draft`)
      .set(manager.auth)
      .send({ reason: 'Need fix' });
    expect(managerReturn.status).toBe(200);

    const finish = await request(app)
      .post(`/api/v1/transactions/${transactionId}/finish`)
      .set(employee.auth);
    expect(finish.status).toBe(200);

    const settle = await request(app)
      .post(`/api/v1/transactions/${transactionId}/settle`)
      .set(manager.auth)
      .send({});
    expect(settle.status).toBe(200);

    const managerReopen = await request(app)
      .post(`/api/v1/transactions/${transactionId}/reopen`)
      .set(manager.auth)
      .send({ reason: 'Nope' });
    expect(managerReopen.status).toBe(403);

    const ownerReopen = await request(app)
      .post(`/api/v1/transactions/${transactionId}/reopen`)
      .set(owner.auth)
      .send({ reason: 'Correction' });
    expect(ownerReopen.status).toBe(200);

    await request(app)
      .post(`/api/v1/transactions/${transactionId}/settle`)
      .set(owner.auth)
      .send({});

    const employeeReceipt = await request(app)
      .get(`/api/v1/transactions/${transactionId}/receipt`)
      .set(employee.auth);
    expect(employeeReceipt.status).toBe(200);

    const managerReceipt = await request(app)
      .get(`/api/v1/transactions/${transactionId}/receipt`)
      .set(manager.auth);
    expect(managerReceipt.status).toBe(200);
  });
});
