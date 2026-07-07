import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeCompanyPayload } from '../../factories/company.factory.js';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';

async function createSecondCompanyOwner(app: import('express').Express) {
  await request(app)
    .post('/api/v1/companies')
    .send(
      makeCompanyPayload({
        name: 'other-co',
        email: 'other-co@scrappy.test',
        ownerEmail: 'owner2@scrappy.test',
      }),
    );
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'owner2@scrappy.test', password: 'password123' });
  return { Authorization: `Bearer ${login.body.data.accessToken}` };
}

describe('transaction tenant isolation api', () => {
  it('blocks cross-company access across all transaction operations', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);
    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const transactionId = create.body.data.id as string;
    const itemId = create.body.data.items[0].id as string;

    const outsiderAuth = await createSecondCompanyOwner(app);

    const view = await request(app).get(`/api/v1/transactions/${transactionId}`).set(outsiderAuth);
    expect(view.status).toBe(404);

    const update = await request(app)
      .patch(`/api/v1/transactions/${transactionId}`)
      .set(outsiderAuth)
      .send({ partyName: 'Hijack' });
    expect(update.status).toBe(404);

    const cancel = await request(app)
      .post(`/api/v1/transactions/${transactionId}/cancel`)
      .set(outsiderAuth)
      .send({});
    expect(cancel.status).toBe(404);

    const archive = await request(app)
      .post(`/api/v1/transactions/${transactionId}/archive`)
      .set(outsiderAuth);
    expect(archive.status).toBe(404);

    const listItems = await request(app)
      .get(`/api/v1/transactions/${transactionId}/items`)
      .set(outsiderAuth);
    expect(listItems.status).toBe(404);

    const addItem = await request(app)
      .post(`/api/v1/transactions/${transactionId}/items`)
      .set(outsiderAuth)
      .send({ materialName: 'X', weight: 1, unit: 'KG', price: 1 });
    expect(addItem.status).toBe(404);

    const removeItem = await request(app)
      .delete(`/api/v1/transactions/${transactionId}/items/${itemId}`)
      .set(outsiderAuth);
    expect(removeItem.status).toBe(404);

    const listAttachments = await request(app)
      .get(`/api/v1/transactions/${transactionId}/attachments`)
      .set(outsiderAuth);
    expect(listAttachments.status).toBe(404);

    const addAttachment = await request(app)
      .post(`/api/v1/transactions/${transactionId}/attachments`)
      .set(outsiderAuth)
      .attach('file', Buffer.from('bytes'), { filename: 'x.jpg', contentType: 'image/jpeg' });
    expect(addAttachment.status).toBe(404);
  });
});
