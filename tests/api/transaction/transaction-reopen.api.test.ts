import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createManagerUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('transaction reopen api', () => {
  it('allows owner reopen, forbids manager reopen, and supports re-settle', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );
    const manager = await createManagerUser(app, userRepository, owner.companyId);

    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const transactionId = create.body.data.id as string;
    await request(app).post(`/api/v1/transactions/${transactionId}/finish`).set(employee.auth);
    await request(app)
      .post(`/api/v1/transactions/${transactionId}/settle`)
      .set(manager.auth)
      .send({});

    const managerReopen = await request(app)
      .post(`/api/v1/transactions/${transactionId}/reopen`)
      .set(manager.auth)
      .send({ reason: 'Managers cannot reopen' });
    expect(managerReopen.status).toBe(403);

    const reopen = await request(app)
      .post(`/api/v1/transactions/${transactionId}/reopen`)
      .set(owner.auth)
      .send({ reason: 'Incorrect amount' });
    expect(reopen.status).toBe(200);
    expect(reopen.body.data.status).toBe('READY_FOR_PAYMENT');
    expect(reopen.body.data.paidAt).toBeNull();
    expect(reopen.body.data.paidByUserId).toBeNull();
    expect(reopen.body.data.reopenReason).toBe('Incorrect amount');

    const resettle = await request(app)
      .post(`/api/v1/transactions/${transactionId}/settle`)
      .set(manager.auth)
      .send({ settlementNote: 'Corrected settlement' });
    expect(resettle.status).toBe(200);
    expect(resettle.body.data.status).toBe('PAID');
    expect(resettle.body.data.paidAt).toBeTruthy();
    expect(resettle.body.data.paidByUserId).toBe(manager.userId);
  });
});
