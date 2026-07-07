import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  InMemoryTransactionRepository,
  InMemoryTransactionStore,
  InMemoryTransactionSuggestionRepository,
} from '../../setup/in-memory-repositories.js';

async function seed(store: InMemoryTransactionStore, companyId: string) {
  const repo = new InMemoryTransactionRepository(store);
  return repo.create({
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
    items: [
      { id: randomUUID(), materialName: 'Steel', weight: 1, unit: 'KG', price: 50, total: 50 },
      { id: randomUUID(), materialName: 'Steel', weight: 1, unit: 'KG', price: 60, total: 60 },
    ],
  });
}

describe('transaction suggestion persistence', () => {
  it('returns material and price suggestions excluding archived data', async () => {
    const store = new InMemoryTransactionStore();
    const suggestionRepo = new InMemoryTransactionSuggestionRepository(store);
    const companyId = randomUUID();
    await seed(store, companyId);

    const materials = await suggestionRepo.suggestMaterials(companyId, 'ste', 10);
    expect(materials).toHaveLength(1);
    expect(materials[0]!.materialName).toBe('Steel');

    const prices = await suggestionRepo.suggestPrices(companyId, 'Steel', 10);
    expect(prices.map((p) => p.price).sort((a, b) => a - b)).toEqual([50, 60]);
  });

  it('excludes archived transactions', async () => {
    const store = new InMemoryTransactionStore();
    const repo = new InMemoryTransactionRepository(store);
    const suggestionRepo = new InMemoryTransactionSuggestionRepository(store);
    const companyId = randomUUID();
    const detail = await seed(store, companyId);
    await repo.archive(detail.transaction.id, companyId);

    expect(await suggestionRepo.suggestMaterials(companyId, undefined, 10)).toHaveLength(0);
    expect(await suggestionRepo.suggestPrices(companyId, 'Steel', 10)).toHaveLength(0);
  });
});
