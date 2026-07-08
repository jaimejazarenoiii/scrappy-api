import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('transaction return-to-draft api', () => {
  it('allows owner to edit and return a ready-for-payment transaction to draft', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );

    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const transactionId = create.body.data.id as string;

    await request(app).post(`/api/v1/transactions/${transactionId}/finish`).set(employee.auth);

    const ownerEdit = await request(app)
      .patch(`/api/v1/transactions/${transactionId}`)
      .set(owner.auth)
      .send({ partyName: 'Owner Reviewed' });
    expect(ownerEdit.status).toBe(200);
    expect(ownerEdit.body.data.partyName).toBe('Owner Reviewed');
    expect(ownerEdit.body.data.status).toBe('READY_FOR_PAYMENT');

    const returnToDraft = await request(app)
      .post(`/api/v1/transactions/${transactionId}/return-to-draft`)
      .set(owner.auth)
      .send({ reason: 'Need operational correction' });
    expect(returnToDraft.status).toBe(200);
    expect(returnToDraft.body.data.status).toBe('DRAFT');

    const employeeEdit = await request(app)
      .patch(`/api/v1/transactions/${transactionId}`)
      .set(employee.auth)
      .send({ partyName: 'Employee Fixed' });
    expect(employeeEdit.status).toBe(200);
  });
});
