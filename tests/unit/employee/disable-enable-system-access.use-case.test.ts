import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { DisableSystemAccessUseCase } from '../../../src/modules/employee/application/use-cases/disable-system-access.use-case.js';
import { EnableSystemAccessUseCase } from '../../../src/modules/employee/application/use-cases/enable-system-access.use-case.js';
import { EmployeeAccountProvisioningService } from '../../../src/modules/employee/application/services/employee-account-provisioning.service.js';
import { LifecycleConflictError } from '../../../src/shared/errors/http-exceptions.js';
import {
  FakePasswordHasher,
  InMemoryEmployeeRepository,
  InMemorySessionRepository,
  InMemoryUserRepository,
} from '../../setup/in-memory-repositories.js';
import { setupTestEnv } from '../../setup/test-app.js';

describe('DisableEnableSystemAccessUseCase', () => {
  beforeAll(() => setupTestEnv());

  async function buildLinked() {
    const companyId = randomUUID();
    const userRepository = new InMemoryUserRepository();
    const employeeRepository = new InMemoryEmployeeRepository(userRepository.users);
    const sessionRepository = new InMemorySessionRepository();
    const provisioning = new EmployeeAccountProvisioningService(
      employeeRepository,
      userRepository,
      new FakePasswordHasher(),
    );
    const created = await provisioning.createEmployeeWithAccount(
      'OWNER',
      {
        id: randomUUID(),
        companyId,
        firstName: 'Maya',
        lastName: 'Manager',
        weeklySalary: 5000,
      },
      {
        email: 'maya@scrappy.test',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'EMPLOYEE',
      },
    );
    await sessionRepository.create({
      id: randomUUID(),
      userId: created.user.id,
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 60_000),
    });
    return {
      companyId,
      employeeId: created.employee.id,
      userId: created.user.id,
      userRepository,
      sessionRepository,
      disable: new DisableSystemAccessUseCase(
        employeeRepository,
        userRepository,
        sessionRepository,
      ),
      enable: new EnableSystemAccessUseCase(employeeRepository, userRepository),
    };
  }

  it('disables access, revokes sessions, and keeps employee active', async () => {
    const f = await buildLinked();
    const result = await f.disable.execute(f.employeeId, f.companyId);
    expect(result.status).toBe('ACTIVE');
    expect(result.linkedUser?.status).toBe('INACTIVE');
    const user = await f.userRepository.findById(f.userId, f.companyId);
    expect(user?.isActive()).toBe(false);
    const sessions = [...f.sessionRepository.sessions.values()];
    expect(sessions.every((s) => s.revokedAt !== null)).toBe(true);
  });

  it('enables a previously disabled account', async () => {
    const f = await buildLinked();
    await f.disable.execute(f.employeeId, f.companyId);
    const result = await f.enable.execute(f.employeeId, f.companyId);
    expect(result.linkedUser?.status).toBe('ACTIVE');
  });

  it('rejects disable when already inactive', async () => {
    const f = await buildLinked();
    await f.disable.execute(f.employeeId, f.companyId);
    await expect(f.disable.execute(f.employeeId, f.companyId)).rejects.toThrow(
      LifecycleConflictError,
    );
  });

  it('rejects enable when already active', async () => {
    const f = await buildLinked();
    await expect(f.enable.execute(f.employeeId, f.companyId)).rejects.toThrow(
      LifecycleConflictError,
    );
  });
});
