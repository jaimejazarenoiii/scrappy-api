import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { CreateEmployeeUseCase } from '../../../src/modules/employee/application/use-cases/create-employee.use-case.js';
import { EmployeeAccountProvisioningService } from '../../../src/modules/employee/application/services/employee-account-provisioning.service.js';
import {
  DuplicateResourceError,
  ForbiddenError,
  ValidationAppError,
} from '../../../src/shared/errors/http-exceptions.js';
import {
  FakePasswordHasher,
  InMemoryEmployeeRepository,
  InMemoryUserRepository,
} from '../../setup/in-memory-repositories.js';
import { setupTestEnv } from '../../setup/test-app.js';

describe('CreateEmployeeUseCase with optional account', () => {
  beforeAll(() => setupTestEnv());

  function build() {
    const companyId = randomUUID();
    const userRepository = new InMemoryUserRepository();
    const employeeRepository = new InMemoryEmployeeRepository(userRepository.users);
    const provisioning = new EmployeeAccountProvisioningService(
      employeeRepository,
      userRepository,
      new FakePasswordHasher(),
    );
    const useCase = new CreateEmployeeUseCase(employeeRepository, provisioning);
    return { companyId, userRepository, employeeRepository, useCase };
  }

  it('creates an employee without an account', async () => {
    const f = build();
    const result = await f.useCase.execute(
      f.companyId,
      { firstName: 'Ana', lastName: 'Santos', weeklySalary: 3500 },
      'OWNER',
    );
    expect(result.userId).toBeNull();
    expect(result.linkedUser).toBeNull();
  });

  it('creates an employee with a linked account', async () => {
    const f = build();
    const result = await f.useCase.execute(
      f.companyId,
      {
        firstName: 'Ben',
        lastName: 'Reyes',
        weeklySalary: 3800,
        createAccount: true,
        account: {
          email: 'ben@scrappy.test',
          password: 'password123',
          confirmPassword: 'password123',
          role: 'EMPLOYEE',
        },
      },
      'OWNER',
    );
    expect(result.userId).toBeTruthy();
    expect(result.linkedUser?.email).toBe('ben@scrappy.test');
    expect(result.linkedUser?.status).toBe('ACTIVE');
    const user = await f.userRepository.findByEmail('ben@scrappy.test');
    expect(user?.employeeId).toBe(result.id);
  });

  it('rejects manager assigning OWNER role', async () => {
    const f = build();
    await expect(
      f.useCase.execute(
        f.companyId,
        {
          firstName: 'X',
          lastName: 'Y',
          weeklySalary: 1,
          createAccount: true,
          account: {
            email: 'x@scrappy.test',
            password: 'password123',
            confirmPassword: 'password123',
            role: 'OWNER',
          },
        },
        'MANAGER',
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it('rejects duplicate email', async () => {
    const f = build();
    await f.userRepository.create({
      id: randomUUID(),
      companyId: f.companyId,
      email: 'dup@scrappy.test',
      passwordHash: 'hashed:x',
      role: 'EMPLOYEE',
    });
    await expect(
      f.useCase.execute(
        f.companyId,
        {
          firstName: 'Dup',
          lastName: 'User',
          weeklySalary: 1,
          createAccount: true,
          account: {
            email: 'dup@scrappy.test',
            password: 'password123',
            confirmPassword: 'password123',
            role: 'EMPLOYEE',
          },
        },
        'OWNER',
      ),
    ).rejects.toThrow(DuplicateResourceError);
  });

  it('rejects createAccount without account payload', async () => {
    const f = build();
    await expect(
      f.useCase.execute(
        f.companyId,
        { firstName: 'A', lastName: 'B', weeklySalary: 1, createAccount: true },
        'OWNER',
      ),
    ).rejects.toThrow(ValidationAppError);
  });
});
