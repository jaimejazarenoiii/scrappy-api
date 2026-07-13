import { randomUUID } from 'node:crypto';
import type { PasswordHasher } from '../../../../shared/auth/password-hasher.interface.js';
import { DuplicateResourceError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRole } from '../../../../shared/policy/roles.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { AccountCredentialsRequestDto } from '../dto/account-credentials.request.js';
import { assertCanAssignRole } from '../policies/account-provisioning.policy.js';
import type {
  CreateEmployeeInput,
  EmployeeRepository,
  EmployeeWithLinkedUser,
} from '../../domain/employee.repository.js';

export class EmployeeAccountProvisioningService {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  /**
   * Validates role/email and creates Employee + User atomically.
   */
  async createEmployeeWithAccount(
    actorRole: UserRole,
    employeeInput: CreateEmployeeInput,
    account: AccountCredentialsRequestDto,
  ): Promise<EmployeeWithLinkedUser> {
    assertCanAssignRole(actorRole, account.role);
    await this.assertEmailAvailable(account.email);
    const passwordHash = await this.passwordHasher.hash(account.password);
    return this.employeeRepository.createWithLinkedAccount(employeeInput, {
      id: randomUUID(),
      email: account.email.toLowerCase(),
      passwordHash,
      role: account.role,
    });
  }

  /**
   * Validates role/email and grants a new User linked to an existing Employee.
   */
  async grantAccountToEmployee(
    actorRole: UserRole,
    employeeId: string,
    companyId: string,
    account: AccountCredentialsRequestDto,
  ): Promise<EmployeeWithLinkedUser> {
    assertCanAssignRole(actorRole, account.role);
    await this.assertEmailAvailable(account.email);
    const passwordHash = await this.passwordHasher.hash(account.password);
    return this.employeeRepository.grantLinkedAccount(employeeId, companyId, {
      id: randomUUID(),
      email: account.email.toLowerCase(),
      passwordHash,
      role: account.role,
    });
  }

  private async assertEmailAvailable(email: string): Promise<void> {
    const existing = await this.userRepository.findByEmail(email.toLowerCase());
    if (existing) throw new DuplicateResourceError('Email already exists');
  }
}
