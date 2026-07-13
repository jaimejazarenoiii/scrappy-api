import type { PasswordHasher } from '../../../../shared/auth/password-hasher.interface.js';
import {
  ResourceNotFoundError,
  ValidationAppError,
} from '../../../../shared/errors/http-exceptions.js';
import type { SessionRepository } from '../../../session/domain/session.repository.js';
import type { UserRepository } from '../../domain/user.repository.js';
import type { ChangePasswordRequestDto } from '../dto/change-password.request.js';
import {
  logUserPasswordAudit,
  USER_PASSWORD_AUDIT_ACTIONS,
} from '../services/user-password-audit.service.js';

export interface ChangePasswordResultDto {
  passwordChangeRequired: false;
  passwordChangedAt: string;
}

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(
    userId: string,
    companyId: string,
    input: ChangePasswordRequestDto,
  ): Promise<ChangePasswordResultDto> {
    const user = await this.userRepository.findById(userId, companyId);
    if (!user) throw new ResourceNotFoundError('User not found');

    const currentValid = await this.passwordHasher.compare(
      input.currentPassword,
      user.passwordHash,
    );
    if (!currentValid) {
      throw new ValidationAppError('Current password is incorrect', [
        { path: 'currentPassword', message: 'Current password is incorrect' },
      ]);
    }

    const passwordHash = await this.passwordHasher.hash(input.newPassword);
    const passwordChangedAt = new Date();
    await this.userRepository.updatePassword(userId, companyId, passwordHash, {
      passwordChangeRequired: false,
      passwordChangedAt,
    });
    await this.sessionRepository.revokeAllForUser(userId);

    logUserPasswordAudit({
      action: USER_PASSWORD_AUDIT_ACTIONS.CHANGED,
      companyId,
      resourceType: 'user',
      resourceId: userId,
      actorUserId: userId,
    });

    return {
      passwordChangeRequired: false,
      passwordChangedAt: passwordChangedAt.toISOString(),
    };
  }
}
