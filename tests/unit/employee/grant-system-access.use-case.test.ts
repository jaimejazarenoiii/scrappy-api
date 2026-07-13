import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { GrantSystemAccessUseCase } from '../../../src/modules/employee/application/use-cases/grant-system-access.use-case.js';
import { EmployeeAccountProvisioningService } from '../../../src/modules/employee/application/services/employee-account-provisioning.service.js';
import {
  LifecycleConflictError,
  ResourceNotFoundError,
} from '../../../src/shared/errors/http-exceptions.js';
import {
  FakePasswordHasher,
  InMemoryEmployeeRepository,
  InMemoryUserRepository,
} from '../../setup/in-memory-repositories.js';
import { setupTestEnv } from '../../setup/test-app.js';

describe('GrantSystemAccessUseCase', () => {
  beforeAll(() => setupTestEnv());

  async function build() {
    const companyId = randomUUID();
    const userRepository = new InMemoryUserRepository();
    const employeeRepository = new InMemoryEmployeeRepository(userRepository.users);
    const provisioning = new EmployeeAccountProvisioningService(
      employeeRepository,
      userRepository,
      new FakePasswordHasher(),
    );
    const useCase = new GrantSystemAccessUseCase(employeeRepository, provisioning);
    const employee = await employeeRepository.create({
      id: randomUUID(),
      companyId,
      firstName: 'Carlo',
      lastName: 'Dela Cruz',
      weeklySalary: 4200,
    });
    return { companyId, employee, useCase, userRepository };
  }

  it('grants access to an unlinked employee', async () => {
    const f = await build();
    const result = await f.useCase.execute(f.employee.id, f.companyId, 'OWNER', {
      email: 'carlo@scrappy.test',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'EMPLOYEE',
    });
    expect(result.linkedUser?.email).toBe('carlo@scrappy.test');
    expect(result.userId).toBe(result.linkedUser?.id);
  });

  it('rejects when employee already has a user', async () => {
    const f = await build();
    await f.useCase.execute(f.employee.id, f.companyId, 'OWNER', {
      email: 'first@scrappy.test',
      password: 'password123',
      confirmPassword: 'password123',
      role: 'EMPLOYEE',
    });
    await expect(
      f.useCase.execute(f.employee.id, f.companyId, 'OWNER', {
        email: 'second@scrappy.test',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'EMPLOYEE',
      }),
    ).rejects.toThrow(LifecycleConflictError);
  });

  it('rejects missing employee', async () => {
    const f = await build();
    await expect(
      f.useCase.execute(randomUUID(), f.companyId, 'OWNER', {
        email: 'missing@scrappy.test',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'EMPLOYEE',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
