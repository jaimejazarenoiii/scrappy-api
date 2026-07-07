import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('transaction update api', () => {
  it('applies partial auto-save updates to a draft', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);
    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const transactionId = create.body.data.id as string;

    const update = await request(app)
      .patch(`/api/v1/transactions/${transactionId}`)
      .set(employee.auth)
      .send({ partyName: 'Updated Party', notes: 'auto-save' });
    expect(update.status).toBe(200);
    expect(update.body.data.partyName).toBe('Updated Party');
    expect(update.body.data.notes).toBe('auto-save');
    expect(update.body.data.status).toBe('DRAFT');
  });

  it('rejects edits to a cancelled transaction', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);
    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const transactionId = create.body.data.id as string;

    await request(app)
      .post(`/api/v1/transactions/${transactionId}/cancel`)
      .set(employee.auth)
      .send({});

    const update = await request(app)
      .patch(`/api/v1/transactions/${transactionId}`)
      .set(employee.auth)
      .send({ partyName: 'Too late' });
    expect(update.status).toBe(409);
  });

  it('rejects an empty update body', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);
    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const transactionId = create.body.data.id as string;

    const update = await request(app)
      .patch(`/api/v1/transactions/${transactionId}`)
      .set(employee.auth)
      .send({});
    expect(update.status).toBe(400);
  });
});
