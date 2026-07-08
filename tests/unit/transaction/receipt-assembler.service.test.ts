import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { ReceiptAssemblerService } from '../../../src/modules/transaction/application/services/receipt-assembler.service.js';
import { ResourceNotFoundError } from '../../../src/shared/errors/http-exceptions.js';
import {
  InMemoryCompanyRepository,
  InMemoryEmployeeRepository,
  InMemoryTransactionRepository,
  InMemoryTransactionStore,
  InMemoryUserRepository,
} from '../../setup/in-memory-repositories.js';
import { setupTestEnv } from '../../setup/test-app.js';

async function buildFixture(paid = true) {
  const companyId = randomUUID();
  const companyRepository = new InMemoryCompanyRepository();
  const userRepository = new InMemoryUserRepository();
  const employeeRepository = new InMemoryEmployeeRepository();
  const store = new InMemoryTransactionStore();
  const transactionRepository = new InMemoryTransactionRepository(store);

  await companyRepository.create({
    id: companyId,
    name: 'Scrappy Co',
    contactNumber: '09170000000',
    email: 'ops@scrappy.test',
    address: '1 Scrap Ave',
  });

  const employeeId = randomUUID();
  const paidByUserId = randomUUID();
  await employeeRepository.create({
    id: employeeId,
    companyId,
    firstName: 'Maya',
    lastName: 'Manager',
    weeklySalary: 5000,
  });
  await userRepository.create({
    id: paidByUserId,
    companyId,
    email: 'maya@scrappy.test',
    passwordHash: 'hashed',
    role: 'MANAGER',
  });
  await userRepository.linkEmployee(paidByUserId, employeeId);
  await employeeRepository.linkUser(employeeId, companyId, paidByUserId);

  const detail = await transactionRepository.create({
    id: randomUUID(),
    companyId,
    createdByUserId: randomUUID(),
    transactionNumber: 'IN-20260708-000040',
    direction: 'INBOUND',
    partyName: 'Acme Recycling',
    transactionDate: new Date('2026-07-08T01:00:00.000Z'),
    locationType: 'OUTSIDE',
    outsideLocationName: 'Roadside',
    outsideAddress: '123 Lane',
    assignedEmployeeIds: [],
    items: [
      {
        id: randomUUID(),
        materialName: 'Copper',
        weight: 10,
        unit: 'KG',
        price: 250,
        total: 2500,
      },
    ],
  });

  if (paid) {
    await transactionRepository.update(detail.transaction.id, companyId, {
      status: 'PAID',
      submittedAt: new Date(),
      submittedByUserId: randomUUID(),
      paidAt: new Date('2026-07-08T03:00:00.000Z'),
      paidByUserId,
    });
  }

  const updated = await transactionRepository.findDetailById(detail.transaction.id, companyId);
  return {
    detail: updated!,
    assembler: new ReceiptAssemblerService(companyRepository, userRepository, employeeRepository),
  };
}

describe('ReceiptAssemblerService', () => {
  beforeAll(() => setupTestEnv());

  it('assembles receipt fields for a paid transaction', async () => {
    const f = await buildFixture(true);
    const receipt = await f.assembler.build(f.detail);
    expect(receipt.transactionNumber).toBe('IN-20260708-000040');
    expect(receipt.company.name).toBe('Scrappy Co');
    expect(receipt.directionLabel).toBe('BUY');
    expect(receipt.partyName).toBe('Acme Recycling');
    expect(receipt.items).toHaveLength(1);
    expect(receipt.grandTotal).toBe(2500);
    expect(receipt.paidByDisplayName).toBe('Maya Manager');
    expect(receipt.paidAt).toEqual(new Date('2026-07-08T03:00:00.000Z'));
  });

  it('rejects assembly when paid metadata is missing', async () => {
    const f = await buildFixture(false);
    await expect(f.assembler.build(f.detail)).rejects.toThrow(ResourceNotFoundError);
  });
});
