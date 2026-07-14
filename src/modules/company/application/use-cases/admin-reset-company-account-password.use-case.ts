import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import {
  LifecycleConflictError,
  ResourceNotFoundError,
  ValidationAppError,
} from '../../../../shared/errors/http-exceptions.js';
import type { PasswordHasher } from '../../../../shared/auth/password-hasher.interface.js';
import { assertSuperAdmin } from '../../../subscription/application/policies/subscription-authorization.policy.js';
import type { CompanyRepository } from '../../domain/company.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { SessionRepository } from '../../../session/domain/session.repository.js';
import {
  logUserPasswordAudit,
  USER_PASSWORD_AUDIT_ACTIONS,
} from '../../../user/application/services/user-password-audit.service.js';

export interface AdminResetCompanyAccountPasswordResultDto {
  userId: string;
  employeeId: string | null;
  passwordChangeRequired: true;
}

export class AdminResetCompanyAccountPasswordUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(
    auth: AuthorizationContext,
    companyId: string,
    userId: string,
    temporaryPassword: string,
  ): Promise<AdminResetCompanyAccountPasswordResultDto> {
    assertSuperAdmin(auth);
    const company = await this.companyRepository.findById(companyId);
    if (!company || company.isDeleted()) {
      throw new ResourceNotFoundError('Company not found');
    }

    const trimmed = temporaryPassword.trim();
    if (trimmed.length < 8) {
      throw new ValidationAppError('Temporary password must be at least 8 characters');
    }

    const user = await this.userRepository.findById(userId, companyId);
    if (!user || user.role === 'SUPER_ADMIN') {
      throw new ResourceNotFoundError('Account not found');
    }
    if (!user.isActive()) {
      throw new LifecycleConflictError('Cannot reset password for an inactive user account');
    }

    const passwordHash = await this.passwordHasher.hash(trimmed);
    await this.userRepository.updatePassword(user.id, companyId, passwordHash, {
      passwordChangeRequired: true,
      passwordChangedAt: new Date(),
    });
    await this.sessionRepository.revokeAllForUser(user.id);

    logUserPasswordAudit({
      action: USER_PASSWORD_AUDIT_ACTIONS.ADMIN_RESET,
      companyId,
      resourceType: 'user',
      resourceId: user.id,
      actorUserId: auth.userId,
      metadata: { source: 'admin.company_account' },
    });

    return {
      userId: user.id,
      employeeId: user.employeeId,
      passwordChangeRequired: true,
    };
  }
}
