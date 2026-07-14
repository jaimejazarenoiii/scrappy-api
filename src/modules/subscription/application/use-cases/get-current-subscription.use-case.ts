import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import type { CompanySubscriptionRepository } from '../../domain/company-subscription.repository.js';
import type { CompanySubscriptionResponseDto } from '../dto/subscription.dto.js';
import { toCompanySubscriptionResponse } from '../dto/subscription.dto.js';
import { assertSuperAdmin } from '../policies/subscription-authorization.policy.js';

export class GetCurrentSubscriptionUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly subscriptionRepository: CompanySubscriptionRepository,
  ) {}

  async execute(
    auth: AuthorizationContext,
    companyId: string,
  ): Promise<CompanySubscriptionResponseDto> {
    assertSuperAdmin(auth);
    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new ResourceNotFoundError('Company not found');

    const active = await this.subscriptionRepository.findActiveByCompany(companyId);
    if (!active) {
      throw new ResourceNotFoundError('No ACTIVE subscription period');
    }

    return toCompanySubscriptionResponse(active);
  }
}
