import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  InMemoryTransactionItemRepository,
  InMemoryTransactionRepository,
  InMemoryTransactionStore,
} from '../../setup/in-memory-repositories.js';

async function seedTransaction(repo: InMemoryTransactionRepository, companyId: string) {
  const detail = await repo.create({
    id: randomUUID(),
    companyId,
    createdByUserId: randomUUID(),
    direction: 'INBOUND',
    partyName: 'Acme',
    transactionDate: new Date(),
    locationType: 'OUTSIDE',
    outsideLocationName: 'Roadside',
    outsideAddress: '123 Lane',
    assignedEmployeeIds: [],
    items: [],
  });
  return detail.transaction.id;
}

describe('transaction item persistence', () => {
  it('creates, updates, lists, and deletes items scoped to the parent', async () => {
    const store = new InMemoryTransactionStore();
    const transactionRepo = new InMemoryTransactionRepository(store);
    const itemRepo = new InMemoryTransactionItemRepository(store);
    const companyId = randomUUID();
    const transactionId = await seedTransaction(transactionRepo, companyId);

    const item = await itemRepo.create({
      id: randomUUID(),
      transactionId,
      materialName: 'Copper',
      weight: 10,
      unit: 'KG',
      price: 250,
      total: 2500,
    });
    expect(await itemRepo.countByTransaction(transactionId)).toBe(1);

    const updated = await itemRepo.update(item.id, transactionId, { materialName: 'Aluminum' });
    expect(updated.materialName).toBe('Aluminum');

    const list = await itemRepo.listByTransaction(transactionId);
    expect(list).toHaveLength(1);

    await itemRepo.delete(item.id, transactionId);
    expect(await itemRepo.countByTransaction(transactionId)).toBe(0);
  });

  it('does not resolve an item under the wrong parent', async () => {
    const store = new InMemoryTransactionStore();
    const transactionRepo = new InMemoryTransactionRepository(store);
    const itemRepo = new InMemoryTransactionItemRepository(store);
    const companyId = randomUUID();
    const transactionId = await seedTransaction(transactionRepo, companyId);
    const item = await itemRepo.create({
      id: randomUUID(),
      transactionId,
      materialName: 'Copper',
      weight: 10,
      unit: 'KG',
      price: 250,
      total: 2500,
    });

    expect(await itemRepo.findById(item.id, randomUUID())).toBeNull();
    expect(await itemRepo.findById(item.id, transactionId)).not.toBeNull();
  });
});
