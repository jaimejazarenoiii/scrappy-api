import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { GetMaterialSuggestionsUseCase } from '../../../src/modules/transaction/application/use-cases/get-material-suggestions.use-case.js';
import { GetPriceSuggestionsUseCase } from '../../../src/modules/transaction/application/use-cases/get-price-suggestions.use-case.js';
import {
  InMemoryTransactionRepository,
  InMemoryTransactionStore,
  InMemoryTransactionSuggestionRepository,
} from '../../setup/in-memory-repositories.js';

async function seed(store: InMemoryTransactionStore, companyId: string) {
  const repo = new InMemoryTransactionRepository(store);
  await repo.create({
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
      {
        id: randomUUID(),
        materialName: 'Copper Wire',
        weight: 1,
        unit: 'KG',
        price: 100,
        total: 100,
      },
      {
        id: randomUUID(),
        materialName: 'Copper Wire',
        weight: 1,
        unit: 'KG',
        price: 120,
        total: 120,
      },
      { id: randomUUID(), materialName: 'Aluminum', weight: 1, unit: 'KG', price: 80, total: 80 },
    ],
  });
  return repo;
}

describe('transaction suggestion use cases', () => {
  it('suggests material names filtered by prefix and scoped to company', async () => {
    const store = new InMemoryTransactionStore();
    const companyId = randomUUID();
    await seed(store, companyId);
    const useCase = new GetMaterialSuggestionsUseCase(
      new InMemoryTransactionSuggestionRepository(store),
    );

    const all = await useCase.execute(companyId, { limit: 10 });
    expect(all.map((s) => s.materialName).sort()).toEqual(['Aluminum', 'Copper Wire']);

    const filtered = await useCase.execute(companyId, { q: 'copp', limit: 10 });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]!.materialName).toBe('Copper Wire');

    const otherCompany = await useCase.execute(randomUUID(), { limit: 10 });
    expect(otherCompany).toHaveLength(0);
  });

  it('suggests distinct prices for a material', async () => {
    const store = new InMemoryTransactionStore();
    const companyId = randomUUID();
    await seed(store, companyId);
    const useCase = new GetPriceSuggestionsUseCase(
      new InMemoryTransactionSuggestionRepository(store),
    );

    const prices = await useCase.execute(companyId, { materialName: 'Copper Wire', limit: 10 });
    expect(prices.map((p) => p.price).sort((a, b) => a - b)).toEqual([100, 120]);
  });

  it('excludes archived transactions from suggestions', async () => {
    const store = new InMemoryTransactionStore();
    const companyId = randomUUID();
    const repo = await seed(store, companyId);
    const [transaction] = [...store.transactions.values()];
    await repo.archive(transaction!.id, companyId);

    const useCase = new GetMaterialSuggestionsUseCase(
      new InMemoryTransactionSuggestionRepository(store),
    );
    const suggestions = await useCase.execute(companyId, { limit: 10 });
    expect(suggestions).toHaveLength(0);
  });
});
