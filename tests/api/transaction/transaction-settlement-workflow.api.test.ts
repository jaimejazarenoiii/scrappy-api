import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('transaction settlement workflow api', () => {
  it('supports finish, settle, receipt, reopen, and re-settle', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );

    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const transactionId = create.body.data.id as string;
    const transactionNumber = create.body.data.transactionNumber as string;

    const finish = await request(app)
      .post(`/api/v1/transactions/${transactionId}/finish`)
      .set(employee.auth);
    expect(finish.status).toBe(200);
    expect(finish.body.data.status).toBe('READY_FOR_PAYMENT');

    const settle = await request(app)
      .post(`/api/v1/transactions/${transactionId}/settle`)
      .set(owner.auth)
      .send({ settlementNote: 'Paid in cash' });
    expect(settle.status).toBe(200);
    expect(settle.body.data.status).toBe('PAID');
    expect(settle.body.data.paidAt).toBeTruthy();
    expect(settle.body.data.paidByUserId).toBe(owner.userId);

    const receipt = await request(app)
      .get(`/api/v1/transactions/${transactionId}/receipt`)
      .set(owner.auth);
    expect(receipt.status).toBe(200);
    expect(receipt.body.data.transactionNumber).toBe(transactionNumber);
    expect(receipt.body.data.grandTotal).toBe(2500);
    expect(receipt.body.data.paidAt).toBeTruthy();

    const reopen = await request(app)
      .post(`/api/v1/transactions/${transactionId}/reopen`)
      .set(owner.auth)
      .send({ reason: 'Amount needs correction' });
    expect(reopen.status).toBe(200);
    expect(reopen.body.data.status).toBe('READY_FOR_PAYMENT');
    expect(reopen.body.data.paidAt).toBeNull();

    const resettle = await request(app)
      .post(`/api/v1/transactions/${transactionId}/settle`)
      .set(owner.auth)
      .send({ settlementNote: 'Re-settled' });
    expect(resettle.status).toBe(200);
    expect(resettle.body.data.status).toBe('PAID');
    expect(resettle.body.data.paidAt).toBeTruthy();
  });
});
