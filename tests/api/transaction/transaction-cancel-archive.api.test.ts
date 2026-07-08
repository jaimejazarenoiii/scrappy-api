import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('transaction cancel and archive api', () => {
  it('cancels a draft and enforces immutability afterward', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);
    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const transactionId = create.body.data.id as string;

    const cancel = await request(app)
      .post(`/api/v1/transactions/${transactionId}/cancel`)
      .set(employee.auth)
      .send({ cancellationReason: 'Mistake' });
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.status).toBe('CANCELLED');

    const edit = await request(app)
      .patch(`/api/v1/transactions/${transactionId}`)
      .set(employee.auth)
      .send({ partyName: 'Nope' });
    expect(edit.status).toBe(409);
  });

  it('archives a transaction and excludes it from default lists', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );
    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const transactionId = create.body.data.id as string;

    const archive = await request(app)
      .post(`/api/v1/transactions/${transactionId}/archive`)
      .set(owner.auth);
    expect(archive.status).toBe(200);
    expect(archive.body.data.deletedAt).not.toBeNull();

    const defaultList = await request(app).get('/api/v1/transactions').set(owner.auth);
    expect(defaultList.body.data).toHaveLength(0);

    const withArchived = await request(app)
      .get('/api/v1/transactions?includeArchived=true')
      .set(owner.auth);
    expect(withArchived.body.data).toHaveLength(1);

    const detail = await request(app).get(`/api/v1/transactions/${transactionId}`).set(owner.auth);
    expect(detail.status).toBe(200);
  });

  it('forbids employees from archiving', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);
    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const transactionId = create.body.data.id as string;

    const archive = await request(app)
      .post(`/api/v1/transactions/${transactionId}/archive`)
      .set(employee.auth);
    expect(archive.status).toBe(403);
  });

  it('allows owner to cancel a ready-for-payment transaction', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { owner, employee } = await setupTransactionActors(
      app,
      userRepository,
      employeeRepository,
    );
    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const transactionId = create.body.data.id as string;

    await request(app).post(`/api/v1/transactions/${transactionId}/finish`).set(employee.auth);

    const cancel = await request(app)
      .post(`/api/v1/transactions/${transactionId}/cancel`)
      .set(owner.auth)
      .send({ cancellationReason: 'Manager rejected settlement' });
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.status).toBe('CANCELLED');
    expect(cancel.body.data.cancelledByUserId).toBe(owner.userId);
  });
});
