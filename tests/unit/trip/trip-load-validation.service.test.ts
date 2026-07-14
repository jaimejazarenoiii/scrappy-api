import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { TripLoadValidationService } from '../../../src/modules/trip/application/services/trip-load-validation.service.js';
import { BusinessRuleViolationError } from '../../../src/shared/errors/http-exceptions.js';
import type { CreateTransactionInput } from '../../../src/modules/transaction/domain/transaction.repository.js';
import {
  InMemoryTransactionRepository,
  InMemoryTransactionStore,
} from '../../setup/in-memory-repositories.js';
import { InMemoryTripLoadRepository } from '../../setup/in-memory-trip-load-repository.js';

async function buildFixture() {
  const companyId = randomUUID();
  const tripId = randomUUID();
  const tripLoadRepository = new InMemoryTripLoadRepository();
  const store = new InMemoryTransactionStore();
  const transactionRepository = new InMemoryTransactionRepository(store);
  await tripLoadRepository.create({
    id: randomUUID(),
    tripId,
    notes: null,
    createdByUserId: randomUUID(),
    items: [
      {
        id: randomUUID(),
        materialName: 'Copper',
        materialNameNorm: 'copper',
        quantity: 100,
        unit: 'KG',
        notes: null,
      },
    ],
  });

  async function addOutbound(weight: number) {
    const id = randomUUID();
    const input: CreateTransactionInput = {
      id,
      companyId,
      createdByUserId: randomUUID(),
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
          materialName: 'Copper',
          weight,
          unit: 'KG',
          price: 1,
          total: weight,
          notes: null,
        },
      ],
    };
    await transactionRepository.create(input);
  }

  const service = new TripLoadValidationService(tripLoadRepository, transactionRepository);
  return { companyId, tripId, service, addOutbound };
}

describe('TripLoadValidationService', () => {
  it('returns no warnings when trip has no load', async () => {
    const f = await buildFixture();
    const warnings = await f.service.validateOutbound({
      companyId: f.companyId,
      tripId: randomUUID(),
      strictLoadValidation: true,
      items: [{ materialName: 'Copper', unit: 'KG', weight: 999 }],
    });
    expect(warnings).toEqual([]);
  });

  it('returns no warnings for unmatched materials', async () => {
    const f = await buildFixture();
    const warnings = await f.service.validateOutbound({
      companyId: f.companyId,
      tripId: f.tripId,
      strictLoadValidation: true,
      items: [{ materialName: 'Gold', unit: 'KG', weight: 999 }],
    });
    expect(warnings).toEqual([]);
  });

  it('warns (non-strict) when outbound exceeds loaded', async () => {
    const f = await buildFixture();
    await f.addOutbound(90);
    const warnings = await f.service.validateOutbound({
      companyId: f.companyId,
      tripId: f.tripId,
      strictLoadValidation: false,
      items: [{ materialName: 'Copper', unit: 'KG', weight: 20 }],
    });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]!.remainingQuantity).toBe(-10);
  });

  it('blocks (strict) when outbound exceeds loaded', async () => {
    const f = await buildFixture();
    await f.addOutbound(90);
    await expect(
      f.service.validateOutbound({
        companyId: f.companyId,
        tripId: f.tripId,
        strictLoadValidation: true,
        items: [{ materialName: 'Copper', unit: 'KG', weight: 20 }],
      }),
    ).rejects.toThrow(BusinessRuleViolationError);
  });

  it('allows outbound within the loaded amount', async () => {
    const f = await buildFixture();
    await f.addOutbound(40);
    const warnings = await f.service.validateOutbound({
      companyId: f.companyId,
      tripId: f.tripId,
      strictLoadValidation: true,
      items: [{ materialName: 'Copper', unit: 'KG', weight: 30 }],
    });
    expect(warnings).toEqual([]);
  });
});
