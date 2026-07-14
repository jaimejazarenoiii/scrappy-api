import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { GetTripLoadSummaryUseCase } from '../../../src/modules/trip/application/use-cases/get-trip-load-summary.use-case.js';
import type { AuthorizationContext } from '../../../src/shared/policy/authorization-context.js';
import type { CreateTransactionInput } from '../../../src/modules/transaction/domain/transaction.repository.js';
import {
  InMemoryTransactionRepository,
  InMemoryTransactionStore,
  InMemoryUserRepository,
} from '../../setup/in-memory-repositories.js';
import { InMemoryTripRepository } from '../../setup/in-memory-trip-repository.js';
import { InMemoryTripLoadRepository } from '../../setup/in-memory-trip-load-repository.js';

async function buildFixture() {
  const companyId = randomUUID();
  const userId = randomUUID();
  const tripRepository = new InMemoryTripRepository();
  const tripLoadRepository = new InMemoryTripLoadRepository();
  const store = new InMemoryTransactionStore();
  const transactionRepository = new InMemoryTransactionRepository(store);
  const userRepository = new InMemoryUserRepository();
  const tripId = randomUUID();
  await tripRepository.create({
    id: tripId,
    companyId,
    tripNumber: 'TRIP-20260714-000004',
    vehicleId: randomUUID(),
    status: 'DRAFT',
    scheduledStart: new Date(),
    origin: 'A',
    destination: 'B',
    notes: null,
    createdByUserId: userId,
    updatedByUserId: userId,
    members: [],
  });
  await tripLoadRepository.create({
    id: randomUUID(),
    tripId,
    notes: 'Cargo',
    createdByUserId: userId,
    items: [
      {
        id: randomUUID(),
        materialName: 'Copper',
        materialNameNorm: 'copper',
        quantity: 100,
        unit: 'KG',
        notes: null,
      },
      {
        id: randomUUID(),
        materialName: 'Steel',
        materialNameNorm: 'steel',
        quantity: 50,
        unit: 'KG',
        notes: null,
      },
    ],
  });

  async function addOutbound(materialName: string, weight: number, cancel = false) {
    const id = randomUUID();
    const input: CreateTransactionInput = {
      id,
      companyId,
      createdByUserId: userId,
      transactionNumber: `OUT-${id.slice(0, 8)}`,
      direction: 'OUTBOUND',
      partyName: 'Buyer',
      transactionDate: new Date(),
      locationType: 'TRIP',
      tripId,
      assignedEmployeeIds: [],
      items: [
        {
          id: randomUUID(),
          materialName,
          weight,
          unit: 'KG',
          price: 10,
          total: weight * 10,
          notes: null,
        },
      ],
    };
    await transactionRepository.create(input);
    if (cancel) {
      await transactionRepository.cancel(id, companyId, { cancellationReason: 'test' });
    }
  }

  const useCase = new GetTripLoadSummaryUseCase(
    tripRepository,
    tripLoadRepository,
    transactionRepository,
    userRepository,
  );
  const auth: AuthorizationContext = { companyId, userId, role: 'OWNER' };
  return { companyId, tripId, addOutbound, useCase, auth };
}

describe('GetTripLoadSummaryUseCase', () => {
  it('computes remaining as loaded minus outbound weights', async () => {
    const f = await buildFixture();
    await f.addOutbound('Copper', 30);
    await f.addOutbound('copper', 10);

    const summary = await f.useCase.execute(f.tripId, f.auth);
    const copper = summary.items.find((item) => item.materialName === 'Copper')!;
    const steel = summary.items.find((item) => item.materialName === 'Steel')!;

    expect(copper.loadedQuantity).toBe(100);
    expect(copper.outboundQuantity).toBe(40);
    expect(copper.remainingQuantity).toBe(60);
    expect(steel.outboundQuantity).toBe(0);
    expect(steel.remainingQuantity).toBe(50);
  });

  it('excludes cancelled outbound transactions from the sum', async () => {
    const f = await buildFixture();
    await f.addOutbound('Copper', 30);
    await f.addOutbound('Copper', 25, true);

    const summary = await f.useCase.execute(f.tripId, f.auth);
    const copper = summary.items.find((item) => item.materialName === 'Copper')!;
    expect(copper.outboundQuantity).toBe(30);
    expect(copper.remainingQuantity).toBe(70);
  });
});
