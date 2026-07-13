import type { PasswordHasher } from '../../../../shared/auth/password-hasher.interface.js';
import { generateTemporaryPassword } from '../../../../shared/auth/temporary-password.js';
import {
  LifecycleConflictError,
  ResourceNotFoundError,
} from '../../../../shared/errors/http-exceptions.js';
import type { UserRole } from '../../../../shared/policy/roles.js';
import type { SessionRepository } from '../../../session/domain/session.repository.js';
import { assertCanResetPassword } from '../../../user/application/policies/password-reset.policy.js';
import {
  logUserPasswordAudit,
  USER_PASSWORD_AUDIT_ACTIONS,
} from '../../../user/application/services/user-password-audit.service.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import { assertEmployeeActive, assertEmployeeHasUser } from '../../domain/employee-rules.js';
import type { EmployeeRepository } from '../../domain/employee.repository.js';

export interface ResetEmployeePasswordResultDto {
  employeeId: string;
  userId: string;
  passwordChangeRequired: true;
  temporaryPassword: string;
}

export class ResetEmployeePasswordUseCase {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(
    employeeId: string,
    companyId: string,
    actorRole: UserRole,
    actorUserId?: string,
  ): Promise<ResetEmployeePasswordResultDto> {
    const employee = await this.employeeRepository.findById(employeeId, companyId);
    if (!employee) throw new ResourceNotFoundError('Employee not found');
    assertEmployeeHasUser(employee);
    assertEmployeeActive(employee);

    const user = await this.userRepository.findById(employee.userId!, companyId);
    if (!user) throw new ResourceNotFoundError('User not found');
    if (!user.isActive()) {
      throw new LifecycleConflictError('Cannot reset password for an inactive user account');
    }

    assertCanResetPassword(actorRole, user.role);

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await this.passwordHasher.hash(temporaryPassword);
    const passwordChangedAt = new Date();

    await this.userRepository.updatePassword(user.id, companyId, passwordHash, {
      passwordChangeRequired: true,
      passwordChangedAt,
    });
    await this.sessionRepository.revokeAllForUser(user.id);

    logUserPasswordAudit({
      action: USER_PASSWORD_AUDIT_ACTIONS.ADMIN_RESET,
      companyId,
      resourceType: 'user',
      resourceId: user.id,
      actorUserId,
      metadata: { employeeId },
    });

    return {
      employeeId: employee.id,
      userId: user.id,
      passwordChangeRequired: true,
      temporaryPassword,
    };
  }
}
