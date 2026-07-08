import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createManagerUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('transaction settlement error api', () => {
  it('rejects invalid transitions and cancelled terminal actions', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );
    const manager = await createManagerUser(app, userRepository, owner.companyId);

    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const transactionId = create.body.data.id as string;

    const settleDraft = await request(app)
      .post(`/api/v1/transactions/${transactionId}/settle`)
      .set(manager.auth)
      .send({});
    expect(settleDraft.status).toBe(409);

    const reopenDraft = await request(app)
      .post(`/api/v1/transactions/${transactionId}/reopen`)
      .set(owner.auth)
      .send({ reason: 'Not paid yet' });
    expect(reopenDraft.status).toBe(409);

    await request(app).post(`/api/v1/transactions/${transactionId}/finish`).set(employee.auth);

    const finishAgain = await request(app)
      .post(`/api/v1/transactions/${transactionId}/finish`)
      .set(employee.auth);
    expect(finishAgain.status).toBe(409);

    await request(app)
      .post(`/api/v1/transactions/${transactionId}/settle`)
      .set(manager.auth)
      .send({});

    const cancelPaid = await request(app)
      .post(`/api/v1/transactions/${transactionId}/cancel`)
      .set(manager.auth)
      .send({});
    expect(cancelPaid.status).toBe(409);

    const returnPaid = await request(app)
      .post(`/api/v1/transactions/${transactionId}/return-to-draft`)
      .set(manager.auth)
      .send({});
    expect(returnPaid.status).toBe(409);

    await request(app)
      .post(`/api/v1/transactions/${transactionId}/reopen`)
      .set(owner.auth)
      .send({ reason: 'Need reopen before cancel' });
    await request(app)
      .post(`/api/v1/transactions/${transactionId}/cancel`)
      .set(manager.auth)
      .send({ cancellationReason: 'Voided' });

    const settleCancelled = await request(app)
      .post(`/api/v1/transactions/${transactionId}/settle`)
      .set(manager.auth)
      .send({});
    expect(settleCancelled.status).toBe(409);

    const receiptCancelled = await request(app)
      .get(`/api/v1/transactions/${transactionId}/receipt`)
      .set(owner.auth);
    expect(receiptCancelled.status).toBe(409);
  });
});
