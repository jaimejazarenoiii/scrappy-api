import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createManagerUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('transaction settle api', () => {
  it('settles a ready-for-payment transaction and rejects duplicate settle', async () => {
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

    const settle = await request(app)
      .post(`/api/v1/transactions/${transactionId}/settle`)
      .set(manager.auth)
      .send({ settlementNote: 'Paid at counter' });
    expect(settle.status).toBe(200);
    expect(settle.body.data.status).toBe('PAID');
    expect(settle.body.data.paidByUserId).toBe(manager.userId);
    expect(settle.body.data.paidAt).toBeTruthy();

    const duplicate = await request(app)
      .post(`/api/v1/transactions/${transactionId}/settle`)
      .set(manager.auth)
      .send({});
    expect(duplicate.status).toBe(409);
  });

  it('forbids employees from settling', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);
    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const transactionId = create.body.data.id as string;
    await request(app).post(`/api/v1/transactions/${transactionId}/finish`).set(employee.auth);

    const settle = await request(app)
      .post(`/api/v1/transactions/${transactionId}/settle`)
      .set(employee.auth)
      .send({});
    expect(settle.status).toBe(403);
  });

  it('cancels a ready-for-payment transaction as manager', async () => {
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

    const cancel = await request(app)
      .post(`/api/v1/transactions/${transactionId}/cancel`)
      .set(manager.auth)
      .send({ cancellationReason: 'Invalid ticket' });
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.status).toBe('CANCELLED');
  });
});
