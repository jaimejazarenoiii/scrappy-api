import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../domain/user.repository.js';
import type { CurrentUserResponseDto } from '../dto/current-user.response.js';

export class GetCurrentUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}
  async execute(userId: string, companyId: string): Promise<CurrentUserResponseDto> {
    const user = await this.userRepository.findById(userId, companyId);
    if (!user) throw new ResourceNotFoundError('User not found');
    return {
      id: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role,
      status: user.status,
      employeeId: user.employeeId,
      passwordChangeRequired: user.passwordChangeRequired,
    };
  }
}
