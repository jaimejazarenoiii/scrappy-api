import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { TransactionNumberService } from '../../../src/modules/transaction/application/services/transaction-number.service.js';
import {
  InMemoryTransactionNumberSequenceRepository,
  InMemoryTransactionStore,
} from '../../setup/in-memory-repositories.js';

describe('transaction number sequence persistence', () => {
  it('allocates unique sequential numbers under concurrent creates', async () => {
    const store = new InMemoryTransactionStore();
    const sequenceRepository = new InMemoryTransactionNumberSequenceRepository(store);
    const service = new TransactionNumberService(sequenceRepository);
    const companyId = randomUUID();
    const transactionDate = new Date('2026-07-08T12:00:00.000Z');

    const numbers = await Promise.all(
      Array.from({ length: 20 }, () => service.allocate(companyId, 'INBOUND', transactionDate)),
    );

    expect(new Set(numbers).size).toBe(20);
    expect(numbers.every((value) => /^IN-20260708-\d{6}$/.test(value))).toBe(true);

    const sequences = numbers
      .map((value) => Number(value.split('-')[2]))
      .sort((left, right) => left - right);
    expect(sequences).toEqual(Array.from({ length: 20 }, (_, index) => index + 1));
  });

  it('scopes sequences separately by direction and date', async () => {
    const store = new InMemoryTransactionStore();
    const sequenceRepository = new InMemoryTransactionNumberSequenceRepository(store);
    const service = new TransactionNumberService(sequenceRepository);
    const companyId = randomUUID();
    const dayOne = new Date('2026-07-08T00:00:00.000Z');
    const dayTwo = new Date('2026-07-09T00:00:00.000Z');

    const inboundOne = await service.allocate(companyId, 'INBOUND', dayOne);
    const outboundOne = await service.allocate(companyId, 'OUTBOUND', dayOne);
    const inboundTwo = await service.allocate(companyId, 'INBOUND', dayTwo);

    expect(inboundOne).toBe('IN-20260708-000001');
    expect(outboundOne).toBe('OUT-20260708-000001');
    expect(inboundTwo).toBe('IN-20260709-000001');
  });
});
