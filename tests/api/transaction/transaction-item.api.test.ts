import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';

async function createDraft(
  app: import('express').Express,
  auth: Record<string, string>,
  employeeId: string,
) {
  const create = await createDraftTransaction(app, auth, [employeeId]);
  return create.body.data.id as string;
}

describe('transaction item api', () => {
  it('adds, updates, lists, and removes items on a draft', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);
    const transactionId = await createDraft(app, employee.auth, employee.employeeId);

    const add = await request(app)
      .post(`/api/v1/transactions/${transactionId}/items`)
      .set(employee.auth)
      .send({ materialName: 'Aluminum', weight: 4, unit: 'KG', price: 100 });
    expect(add.status).toBe(201);
    expect(add.body.data.total).toBe(400);
    const itemId = add.body.data.id as string;

    const update = await request(app)
      .patch(`/api/v1/transactions/${transactionId}/items/${itemId}`)
      .set(employee.auth)
      .send({ price: 200 });
    expect(update.status).toBe(200);
    expect(update.body.data.total).toBe(800);

    const list = await request(app)
      .get(`/api/v1/transactions/${transactionId}/items`)
      .set(employee.auth);
    expect(list.status).toBe(200);
    // one initial item from the factory plus the added item
    expect(list.body.data).toHaveLength(2);

    const remove = await request(app)
      .delete(`/api/v1/transactions/${transactionId}/items/${itemId}`)
      .set(employee.auth);
    expect(remove.status).toBe(200);
    expect(remove.body.data.deleted).toBe(true);
  });

  it('rejects item mutations on a cancelled transaction', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);
    const transactionId = await createDraft(app, employee.auth, employee.employeeId);

    await request(app)
      .post(`/api/v1/transactions/${transactionId}/cancel`)
      .set(employee.auth)
      .send({});

    const add = await request(app)
      .post(`/api/v1/transactions/${transactionId}/items`)
      .set(employee.auth)
      .send({ materialName: 'Aluminum', weight: 4, unit: 'KG', price: 100 });
    expect(add.status).toBe(409);
  });

  it('rejects a total that does not match weight times price', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);
    const transactionId = await createDraft(app, employee.auth, employee.employeeId);

    const add = await request(app)
      .post(`/api/v1/transactions/${transactionId}/items`)
      .set(employee.auth)
      .send({ materialName: 'Aluminum', weight: 4, unit: 'KG', price: 100, total: 1 });
    expect(add.status).toBe(409);
  });
});
