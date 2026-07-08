import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('transaction receipt api', () => {
  it('returns a receipt only after settlement', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );

    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const transactionId = create.body.data.id as string;
    const transactionNumber = create.body.data.transactionNumber as string;

    await request(app).post(`/api/v1/transactions/${transactionId}/finish`).set(employee.auth);

    const beforePaid = await request(app)
      .get(`/api/v1/transactions/${transactionId}/receipt`)
      .set(owner.auth);
    expect(beforePaid.status).toBe(409);

    await request(app)
      .post(`/api/v1/transactions/${transactionId}/settle`)
      .set(owner.auth)
      .send({});

    const receipt = await request(app)
      .get(`/api/v1/transactions/${transactionId}/receipt`)
      .set(owner.auth);
    expect(receipt.status).toBe(200);
    expect(receipt.body.data.transactionNumber).toBe(transactionNumber);
    expect(receipt.body.data.company.name).toBeTruthy();
    expect(receipt.body.data.directionLabel).toBe('BUY');
    expect(receipt.body.data.partyName).toBe('Acme Recycling');
    expect(receipt.body.data.items).toHaveLength(1);
    expect(receipt.body.data.grandTotal).toBe(2500);
    expect(receipt.body.data.paidByDisplayName).toBeTruthy();
    expect(receipt.body.data.paidAt).toBeTruthy();
  });
});
