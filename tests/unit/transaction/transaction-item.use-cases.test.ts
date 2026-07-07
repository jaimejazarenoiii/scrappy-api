import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { AddTransactionItemUseCase } from '../../../src/modules/transaction/application/use-cases/add-transaction-item.use-case.js';
import { UpdateTransactionItemUseCase } from '../../../src/modules/transaction/application/use-cases/update-transaction-item.use-case.js';
import { RemoveTransactionItemUseCase } from '../../../src/modules/transaction/application/use-cases/remove-transaction-item.use-case.js';
import { ListTransactionItemsUseCase } from '../../../src/modules/transaction/application/use-cases/list-transaction-items.use-case.js';
import type { AuthorizationContext } from '../../../src/shared/policy/authorization-context.js';
import {
  BusinessRuleViolationError,
  LifecycleConflictError,
} from '../../../src/shared/errors/http-exceptions.js';
import {
  InMemoryTransactionItemRepository,
  InMemoryTransactionRepository,
  InMemoryTransactionStore,
  InMemoryUserRepository,
} from '../../setup/in-memory-repositories.js';
import { setupTestEnv } from '../../setup/test-app.js';

async function buildFixture() {
  const companyId = randomUUID();
  const store = new InMemoryTransactionStore();
  const transactionRepository = new InMemoryTransactionRepository(store);
  const itemRepository = new InMemoryTransactionItemRepository(store);
  const userRepository = new InMemoryUserRepository();

  const detail = await transactionRepository.create({
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

  const auth: AuthorizationContext = { companyId, userId: randomUUID(), role: 'MANAGER' };

  return {
    companyId,
    transactionId: detail.transaction.id,
    transactionRepository,
    itemRepository,
    userRepository,
    auth,
    addItem: new AddTransactionItemUseCase(transactionRepository, itemRepository, userRepository),
    updateItem: new UpdateTransactionItemUseCase(
      transactionRepository,
      itemRepository,
      userRepository,
    ),
    removeItem: new RemoveTransactionItemUseCase(
      transactionRepository,
      itemRepository,
      userRepository,
    ),
    listItems: new ListTransactionItemsUseCase(
      transactionRepository,
      itemRepository,
      userRepository,
    ),
  };
}

describe('transaction item use cases', () => {
  beforeAll(() => setupTestEnv());

  it('adds an item with a server-computed total', async () => {
    const f = await buildFixture();
    const item = await f.addItem.execute(f.transactionId, f.auth, {
      materialName: 'Copper',
      weight: 10,
      unit: 'KG',
      price: 250,
    });
    expect(item.total).toBe(2500);
  });

  it('recomputes total on update', async () => {
    const f = await buildFixture();
    const item = await f.addItem.execute(f.transactionId, f.auth, {
      materialName: 'Copper',
      weight: 10,
      unit: 'KG',
      price: 250,
    });
    const updated = await f.updateItem.execute(f.transactionId, item.id, f.auth, { weight: 4 });
    expect(updated.total).toBe(1000);
  });

  it('rejects a mismatched provided total', async () => {
    const f = await buildFixture();
    await expect(
      f.addItem.execute(f.transactionId, f.auth, {
        materialName: 'Copper',
        weight: 10,
        unit: 'KG',
        price: 250,
        total: 5,
      }),
    ).rejects.toThrow(BusinessRuleViolationError);
  });

  it('removes and lists items', async () => {
    const f = await buildFixture();
    const item = await f.addItem.execute(f.transactionId, f.auth, {
      materialName: 'Copper',
      weight: 10,
      unit: 'KG',
      price: 250,
    });
    await f.removeItem.execute(f.transactionId, item.id, f.auth);
    const items = await f.listItems.execute(f.transactionId, f.auth);
    expect(items).toHaveLength(0);
  });

  it('rejects mutations on a cancelled transaction', async () => {
    const f = await buildFixture();
    await f.transactionRepository.cancel(f.transactionId, f.companyId, {});
    await expect(
      f.addItem.execute(f.transactionId, f.auth, {
        materialName: 'Copper',
        weight: 10,
        unit: 'KG',
        price: 250,
      }),
    ).rejects.toThrow(LifecycleConflictError);
  });
});
