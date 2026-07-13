import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { EmployeeAccountProvisioningService } from '../../../src/modules/employee/application/services/employee-account-provisioning.service.js';
import { DuplicateResourceError } from '../../../src/shared/errors/http-exceptions.js';
import {
  FakePasswordHasher,
  InMemoryEmployeeRepository,
  InMemoryUserRepository,
} from '../../setup/in-memory-repositories.js';
import { setupTestEnv } from '../../setup/test-app.js';

describe('employee account transaction consistency', () => {
  beforeAll(() => setupTestEnv());

  it('does not create an employee when email is already taken', async () => {
    const companyId = randomUUID();
    const userRepository = new InMemoryUserRepository();
    const employeeRepository = new InMemoryEmployeeRepository(userRepository.users);
    await userRepository.create({
      id: randomUUID(),
      companyId,
      email: 'taken@scrappy.test',
      passwordHash: 'hashed:x',
      role: 'EMPLOYEE',
    });
    const provisioning = new EmployeeAccountProvisioningService(
      employeeRepository,
      userRepository,
      new FakePasswordHasher(),
    );

    await expect(
      provisioning.createEmployeeWithAccount(
        'OWNER',
        {
          id: randomUUID(),
          companyId,
          firstName: 'No',
          lastName: 'Partial',
          weeklySalary: 1000,
        },
        {
          email: 'taken@scrappy.test',
          password: 'password123',
          confirmPassword: 'password123',
          role: 'EMPLOYEE',
        },
      ),
    ).rejects.toThrow(DuplicateResourceError);

    expect(employeeRepository.employees.size).toBe(0);
  });

  it('keeps bidirectional link consistent after create', async () => {
    const companyId = randomUUID();
    const userRepository = new InMemoryUserRepository();
    const employeeRepository = new InMemoryEmployeeRepository(userRepository.users);
    const provisioning = new EmployeeAccountProvisioningService(
      employeeRepository,
      userRepository,
      new FakePasswordHasher(),
    );
    const result = await provisioning.createEmployeeWithAccount(
      'OWNER',
      {
        id: randomUUID(),
        companyId,
        firstName: 'Link',
        lastName: 'Check',
        weeklySalary: 1000,
      },
      {
        email: 'linkcheck@scrappy.test',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'EMPLOYEE',
      },
    );
    expect(result.employee.userId).toBe(result.user.id);
    expect(result.user.employeeId).toBe(result.employee.id);
  });
});
