import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { MAX_TRANSACTION_PHOTOS } from '../../../src/modules/transaction/domain/attachment-constraints.js';
import { createTestContext } from '../../setup/test-app.js';
import { createDraftTransaction, setupTransactionActors } from '../../setup/transaction-helpers.js';

describe('transaction error scenarios api', () => {
  it('rejects a create payload with no items', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);

    const res = await request(app)
      .post('/api/v1/transactions')
      .set(employee.auth)
      .send({
        direction: 'INBOUND',
        partyName: 'Acme',
        locationType: 'OUTSIDE',
        outsideLocationName: 'Roadside',
        outsideAddress: '123 Lane',
        assignedEmployeeIds: [employee.employeeId],
        items: [],
      });
    expect(res.status).toBe(400);
  });

  it('rejects an item total mismatch on create', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);

    const res = await createDraftTransaction(app, employee.auth, [employee.employeeId], {
      items: [{ materialName: 'Copper', weight: 10, unit: 'KG', price: 250, total: 1 }],
    });
    expect(res.status).toBe(409);
  });

  it('rejects a warehouse location missing warehouseId', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);

    const res = await request(app)
      .post('/api/v1/transactions')
      .set(employee.auth)
      .send({
        direction: 'INBOUND',
        partyName: 'Acme',
        locationType: 'WAREHOUSE',
        assignedEmployeeIds: [employee.employeeId],
        items: [{ materialName: 'Copper', weight: 10, unit: 'KG', price: 250 }],
      });
    expect(res.status).toBe(400);
  });

  it('enforces the maximum photo count', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { employee } = await setupTransactionActors(app, userRepository, employeeRepository);
    const create = await createDraftTransaction(app, employee.auth, [employee.employeeId]);
    const transactionId = create.body.data.id as string;

    for (let i = 0; i < MAX_TRANSACTION_PHOTOS; i += 1) {
      const ok = await request(app)
        .post(`/api/v1/transactions/${transactionId}/attachments`)
        .set(employee.auth)
        .attach('file', Buffer.from(`img-${i}`), {
          filename: `p${i}.jpg`,
          contentType: 'image/jpeg',
        });
      expect(ok.status).toBe(201);
    }

    const overflow = await request(app)
      .post(`/api/v1/transactions/${transactionId}/attachments`)
      .set(employee.auth)
      .attach('file', Buffer.from('overflow'), {
        filename: 'overflow.jpg',
        contentType: 'image/jpeg',
      });
    expect(overflow.status).toBe(409);
  });
});
