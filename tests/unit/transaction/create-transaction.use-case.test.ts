import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { CreateTransactionUseCase } from '../../../src/modules/transaction/application/use-cases/create-transaction.use-case.js';
import {
  BusinessRuleViolationError,
  ForbiddenError,
  ResourceNotFoundError,
  ValidationAppError,
} from '../../../src/shared/errors/http-exceptions.js';
import {
  InMemoryAttendanceRepository,
  InMemoryBranchRepository,
  InMemoryEmployeeRepository,
  InMemoryTransactionNumberSequenceRepository,
  InMemoryTransactionRepository,
  InMemoryTransactionStore,
  InMemoryUserRepository,
  InMemoryWarehouseRepository,
} from '../../setup/in-memory-repositories.js';
import { InMemoryTripRepository } from '../../setup/in-memory-trip-repository.js';
import { setupTestEnv } from '../../setup/test-app.js';
import { TransactionNumberService } from '../../../src/modules/transaction/application/services/transaction-number.service.js';

async function buildFixture() {
  const companyId = randomUUID();
  const userRepository = new InMemoryUserRepository();
  const employeeRepository = new InMemoryEmployeeRepository();
  const attendanceRepository = new InMemoryAttendanceRepository();
  const branchRepository = new InMemoryBranchRepository();
  const warehouseRepository = new InMemoryWarehouseRepository();
  const tripRepository = new InMemoryTripRepository();
  const store = new InMemoryTransactionStore();
  const transactionRepository = new InMemoryTransactionRepository(store);
  const transactionNumberSequenceRepository = new InMemoryTransactionNumberSequenceRepository(
    store,
  );

  const employeeId = randomUUID();
  const userId = randomUUID();
  await employeeRepository.create({
    id: employeeId,
    companyId,
    firstName: 'Jane',
    lastName: 'Worker',
    weeklySalary: 3500,
  });
  await userRepository.create({
    id: userId,
    companyId,
    email: 'worker@scrappy.test',
    passwordHash: 'hashed',
    role: 'EMPLOYEE',
  });
  await userRepository.linkEmployee(userId, employeeId);

  const useCase = new CreateTransactionUseCase(
    transactionRepository,
    userRepository,
    employeeRepository,
    attendanceRepository,
    branchRepository,
    warehouseRepository,
    tripRepository,
    new TransactionNumberService(transactionNumberSequenceRepository),
  );

  return {
    companyId,
    userId,
    employeeId,
    userRepository,
    employeeRepository,
    attendanceRepository,
    branchRepository,
    warehouseRepository,
    tripRepository,
    transactionRepository,
    transactionNumberSequenceRepository,
    useCase,
  };
}

function timeIn(
  attendanceRepository: InMemoryAttendanceRepository,
  companyId: string,
  employeeId: string,
) {
  return attendanceRepository.create({ id: randomUUID(), companyId, employeeId });
}

const outsidePayload = {
  direction: 'INBOUND' as const,
  partyName: 'Acme',
  locationType: 'OUTSIDE' as const,
  outsideLocationName: 'Roadside',
  outsideAddress: '123 Lane',
  items: [{ materialName: 'Copper', weight: 10, unit: 'KG' as const, price: 250 }],
};

describe('CreateTransactionUseCase', () => {
  beforeAll(() => setupTestEnv());

  it('creates a draft with items and auto-assigns the acting employee', async () => {
    const f = await buildFixture();
    await timeIn(f.attendanceRepository, f.companyId, f.employeeId);

    const result = await f.useCase.execute(f.companyId, f.userId, {
      ...outsidePayload,
      assignedEmployeeIds: [f.employeeId],
    });

    expect(result.status).toBe('DRAFT');
    expect(result.direction).toBe('INBOUND');
    expect(result.directionLabel).toBe('BUY');
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.total).toBe(2500);
    expect(result.totalAmount).toBe(2500);
    expect(result.assignedEmployeeIds).toContain(f.employeeId);
    expect(result.transactionNumber).toMatch(/^IN-\d{8}-\d{6}$/);
  });

  it('rejects creation when the employee is not timed in', async () => {
    const f = await buildFixture();
    await expect(
      f.useCase.execute(f.companyId, f.userId, {
        ...outsidePayload,
        assignedEmployeeIds: [f.employeeId],
      }),
    ).rejects.toThrow(BusinessRuleViolationError);
  });

  it('rejects when an employee has no linked employee profile', async () => {
    const f = await buildFixture();
    const orphanUserId = randomUUID();
    await f.userRepository.create({
      id: orphanUserId,
      companyId: f.companyId,
      email: 'orphan@scrappy.test',
      passwordHash: 'hashed',
      role: 'EMPLOYEE',
    });
    await expect(
      f.useCase.execute(f.companyId, orphanUserId, {
        ...outsidePayload,
        assignedEmployeeIds: [f.employeeId],
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('allows an owner without a linked employee profile to create a transaction', async () => {
    const f = await buildFixture();
    const ownerUserId = randomUUID();
    await f.userRepository.create({
      id: ownerUserId,
      companyId: f.companyId,
      email: 'owner@scrappy.test',
      passwordHash: 'hashed',
      role: 'OWNER',
    });

    const result = await f.useCase.execute(f.companyId, ownerUserId, {
      ...outsidePayload,
      assignedEmployeeIds: [f.employeeId],
    });

    expect(result.status).toBe('DRAFT');
    expect(result.assignedEmployeeIds).toEqual([f.employeeId]);
  });

  it('allows a manager without a linked employee profile to create a transaction', async () => {
    const f = await buildFixture();
    const managerUserId = randomUUID();
    await f.userRepository.create({
      id: managerUserId,
      companyId: f.companyId,
      email: 'manager@scrappy.test',
      passwordHash: 'hashed',
      role: 'MANAGER',
    });

    const result = await f.useCase.execute(f.companyId, managerUserId, {
      ...outsidePayload,
      assignedEmployeeIds: [f.employeeId],
    });

    expect(result.status).toBe('DRAFT');
    expect(result.assignedEmployeeIds).toEqual([f.employeeId]);
  });

  it('rejects invalid branch location without branchId', async () => {
    const f = await buildFixture();
    await timeIn(f.attendanceRepository, f.companyId, f.employeeId);
    await expect(
      f.useCase.execute(f.companyId, f.userId, {
        direction: 'INBOUND',
        partyName: 'Acme',
        locationType: 'BRANCH',
        assignedEmployeeIds: [f.employeeId],
        items: outsidePayload.items,
      }),
    ).rejects.toThrow(ValidationAppError);
  });

  it('rejects an unknown branch reference', async () => {
    const f = await buildFixture();
    await timeIn(f.attendanceRepository, f.companyId, f.employeeId);
    await expect(
      f.useCase.execute(f.companyId, f.userId, {
        direction: 'INBOUND',
        partyName: 'Acme',
        locationType: 'BRANCH',
        branchId: randomUUID(),
        assignedEmployeeIds: [f.employeeId],
        items: outsidePayload.items,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('rejects an assigned employee outside the company', async () => {
    const f = await buildFixture();
    await timeIn(f.attendanceRepository, f.companyId, f.employeeId);
    await expect(
      f.useCase.execute(f.companyId, f.userId, {
        ...outsidePayload,
        assignedEmployeeIds: [f.employeeId, randomUUID()],
      }),
    ).rejects.toThrow(ValidationAppError);
  });

  it('rejects item total mismatch', async () => {
    const f = await buildFixture();
    await timeIn(f.attendanceRepository, f.companyId, f.employeeId);
    await expect(
      f.useCase.execute(f.companyId, f.userId, {
        ...outsidePayload,
        assignedEmployeeIds: [f.employeeId],
        items: [{ materialName: 'Copper', weight: 10, unit: 'KG', price: 250, total: 1 }],
      }),
    ).rejects.toThrow(BusinessRuleViolationError);
  });

  it('requires tripId for TRIP location type', async () => {
    const f = await buildFixture();
    await timeIn(f.attendanceRepository, f.companyId, f.employeeId);
    await expect(
      f.useCase.execute(f.companyId, f.userId, {
        direction: 'INBOUND',
        partyName: 'Acme',
        locationType: 'TRIP',
        assignedEmployeeIds: [f.employeeId],
        items: outsidePayload.items,
      }),
    ).rejects.toThrow(ValidationAppError);
  });

  it('creates a TRIP transaction linked to an existing trip', async () => {
    const f = await buildFixture();
    await timeIn(f.attendanceRepository, f.companyId, f.employeeId);

    const tripId = randomUUID();
    const vehicleId = randomUUID();
    await f.tripRepository.create({
      id: tripId,
      companyId: f.companyId,
      tripNumber: 'TRIP-20260709-000001',
      vehicleId,
      status: 'DRAFT',
      scheduledStart: new Date(),
      origin: 'Warehouse',
      destination: 'Site',
      notes: null,
      createdByUserId: f.userId,
      updatedByUserId: f.userId,
      members: [{ employeeId: f.employeeId, role: 'DRIVER' }],
    });

    const result = await f.useCase.execute(f.companyId, f.userId, {
      direction: 'INBOUND',
      partyName: 'Acme',
      locationType: 'TRIP',
      tripId,
      assignedEmployeeIds: [f.employeeId],
      items: outsidePayload.items,
    });

    expect(result.locationType).toBe('TRIP');
    expect(result.tripId).toBe(tripId);
    expect(result.outsideLocationName).toBeNull();
  });
});
