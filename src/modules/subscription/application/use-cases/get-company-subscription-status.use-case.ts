import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import type { SubscriptionStatusResponseDto } from '../dto/subscription.dto.js';
import { assertSuperAdmin } from '../policies/subscription-authorization.policy.js';

export class GetCompanySubscriptionStatusUseCase {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async execute(
    auth: AuthorizationContext,
    companyId: string,
  ): Promise<SubscriptionStatusResponseDto> {
    assertSuperAdmin(auth);
    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new ResourceNotFoundError('Company not found');
    return { companyId: company.id, subscriptionStatus: company.subscriptionStatus };
  }
}
