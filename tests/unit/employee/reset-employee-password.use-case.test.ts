import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/config/logger.js', () => ({
  getLogger: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
}));

import { ResetEmployeePasswordUseCase } from '../../../src/modules/employee/application/use-cases/reset-employee-password.use-case.js';
import {
  ForbiddenError,
  LifecycleConflictError,
} from '../../../src/shared/errors/http-exceptions.js';
import {
  FakePasswordHasher,
  InMemoryEmployeeRepository,
  InMemorySessionRepository,
  InMemoryUserRepository,
} from '../../setup/in-memory-repositories.js';

describe('ResetEmployeePasswordUseCase', () => {
  async function seedLinkedEmployee(role: 'EMPLOYEE' | 'MANAGER' = 'EMPLOYEE') {
    const users = new InMemoryUserRepository();
    const employees = new InMemoryEmployeeRepository(users.users);
    const sessions = new InMemorySessionRepository();
    const hasher = new FakePasswordHasher();

    const employee = await employees.create({
      id: 'e1',
      companyId: 'c1',
      firstName: 'Jane',
      lastName: 'Doe',
      weeklySalary: 1000,
    });
    const user = await users.create({
      id: 'u1',
      companyId: 'c1',
      email: 'jane@test.com',
      passwordHash: 'hashed:oldpass12',
      role,
      employeeId: employee.id,
    });
    await employees.linkUser(employee.id, 'c1', user.id);
    await sessions.create({
      id: 's1',
      userId: user.id,
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 60_000),
    });

    return { users, employees, sessions, hasher, employee, user };
  }

  it('generates temp password, stores hash only, sets flag, revokes sessions', async () => {
    const { users, employees, sessions, hasher, employee, user } = await seedLinkedEmployee();
    const useCase = new ResetEmployeePasswordUseCase(employees, users, hasher, sessions);

    const result = await useCase.execute(employee.id, 'c1', 'OWNER', 'actor');

    expect(result.passwordChangeRequired).toBe(true);
    expect(result.temporaryPassword.length).toBeGreaterThanOrEqual(8);
    expect(result.userId).toBe(user.id);

    const updated = await users.findById(user.id, 'c1');
    expect(updated?.passwordHash).toBe(`hashed:${result.temporaryPassword}`);
    expect(updated?.passwordChangeRequired).toBe(true);
    expect(updated?.passwordHash).not.toBe(result.temporaryPassword);
    expect((await sessions.findById('s1'))?.revokedAt).not.toBeNull();
  });

  it('rejects Manager resetting Manager', async () => {
    const { users, employees, sessions, hasher, employee } = await seedLinkedEmployee('MANAGER');
    const useCase = new ResetEmployeePasswordUseCase(employees, users, hasher, sessions);
    await expect(useCase.execute(employee.id, 'c1', 'MANAGER')).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it('rejects inactive user', async () => {
    const { users, employees, sessions, hasher, employee, user } = await seedLinkedEmployee();
    await users.updateStatus(user.id, 'c1', 'INACTIVE');
    const useCase = new ResetEmployeePasswordUseCase(employees, users, hasher, sessions);
    await expect(useCase.execute(employee.id, 'c1', 'OWNER')).rejects.toBeInstanceOf(
      LifecycleConflictError,
    );
  });
});
