import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../domain/user.repository.js';
import type { PasswordStatusResponseDto } from '../dto/password-status.response.js';

export class GetPasswordStatusUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string, companyId: string): Promise<PasswordStatusResponseDto> {
    const user = await this.userRepository.findById(userId, companyId);
    if (!user) throw new ResourceNotFoundError('User not found');
    return {
      passwordChangeRequired: user.passwordChangeRequired,
      passwordChangedAt: user.passwordChangedAt?.toISOString() ?? null,
    };
  }
}
