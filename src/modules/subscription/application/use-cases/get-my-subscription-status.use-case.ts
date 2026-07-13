import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import type { SubscriptionStatusResponseDto } from '../dto/subscription.dto.js';

export class GetMySubscriptionStatusUseCase {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async execute(auth: AuthorizationContext): Promise<SubscriptionStatusResponseDto> {
    const company = await this.companyRepository.findById(auth.companyId);
    if (!company) throw new ResourceNotFoundError('Company not found');
    return { companyId: company.id, subscriptionStatus: company.subscriptionStatus };
  }
}
