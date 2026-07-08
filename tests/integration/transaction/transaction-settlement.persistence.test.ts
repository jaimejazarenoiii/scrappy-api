import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  InMemoryTransactionRepository,
  InMemoryTransactionStore,
} from '../../setup/in-memory-repositories.js';

describe('transaction settlement persistence', () => {
  it('persists settlement and reopen field transitions', async () => {
    const store = new InMemoryTransactionStore();
    const repo = new InMemoryTransactionRepository(store);
    const companyId = randomUUID();
    const settlerId = randomUUID();
    const ownerId = randomUUID();

    const created = await repo.create({
      id: randomUUID(),
      companyId,
      createdByUserId: settlerId,
      transactionNumber: 'IN-20260708-000060',
      direction: 'INBOUND',
      partyName: 'Acme',
      transactionDate: new Date(),
      locationType: 'OUTSIDE',
      outsideLocationName: 'Roadside',
      outsideAddress: '123 Lane',
      assignedEmployeeIds: [],
      items: [
        {
          id: randomUUID(),
          materialName: 'Copper',
          weight: 2,
          unit: 'KG',
          price: 100,
          total: 200,
        },
      ],
    });

    const submitted = await repo.update(created.transaction.id, companyId, {
      status: 'READY_FOR_PAYMENT',
      submittedAt: new Date('2026-07-08T01:00:00.000Z'),
      submittedByUserId: settlerId,
    });
    expect(submitted.transaction.status).toBe('READY_FOR_PAYMENT');
    expect(submitted.transaction.toPrimitives().submittedByUserId).toBe(settlerId);

    const paid = await repo.update(created.transaction.id, companyId, {
      status: 'PAID',
      paidAt: new Date('2026-07-08T02:00:00.000Z'),
      paidByUserId: settlerId,
    });
    expect(paid.transaction.isPaid()).toBe(true);
    expect(paid.transaction.toPrimitives().paidByUserId).toBe(settlerId);

    const reopened = await repo.update(created.transaction.id, companyId, {
      status: 'READY_FOR_PAYMENT',
      paidAt: null,
      paidByUserId: null,
      reopenedAt: new Date('2026-07-08T03:00:00.000Z'),
      reopenedByUserId: ownerId,
      reopenReason: 'Wrong price',
    });
    const props = reopened.transaction.toPrimitives();
    expect(reopened.transaction.isReadyForPayment()).toBe(true);
    expect(props.paidAt).toBeNull();
    expect(props.paidByUserId).toBeNull();
    expect(props.reopenedByUserId).toBe(ownerId);
    expect(props.reopenReason).toBe('Wrong price');
    expect(props.transactionNumber).toBe('IN-20260708-000060');
  });

  it('looks up transactions by transaction number within a company', async () => {
    const store = new InMemoryTransactionStore();
    const repo = new InMemoryTransactionRepository(store);
    const companyId = randomUUID();
    const otherCompanyId = randomUUID();

    await repo.create({
      id: randomUUID(),
      companyId,
      createdByUserId: randomUUID(),
      transactionNumber: 'OUT-20260708-000001',
      direction: 'OUTBOUND',
      partyName: 'Buyer',
      transactionDate: new Date(),
      locationType: 'OUTSIDE',
      outsideLocationName: 'Yard',
      outsideAddress: '1 Road',
      assignedEmployeeIds: [],
      items: [],
    });

    const found = await repo.findByTransactionNumber('OUT-20260708-000001', companyId);
    expect(found?.transactionNumber).toBe('OUT-20260708-000001');
    expect(await repo.findByTransactionNumber('OUT-20260708-000001', otherCompanyId)).toBeNull();
  });
});
