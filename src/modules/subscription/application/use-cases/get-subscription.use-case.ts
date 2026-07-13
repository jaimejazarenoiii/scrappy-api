import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { CompanySubscriptionRepository } from '../../domain/company-subscription.repository.js';
import type { CompanySubscriptionResponseDto } from '../dto/subscription.dto.js';
import { toCompanySubscriptionResponse } from '../dto/subscription.dto.js';
import { assertSuperAdmin } from '../policies/subscription-authorization.policy.js';

export class GetSubscriptionUseCase {
  constructor(private readonly subscriptionRepository: CompanySubscriptionRepository) {}

  async execute(
    auth: AuthorizationContext,
    companyId: string,
    subscriptionId: string,
  ): Promise<CompanySubscriptionResponseDto> {
    assertSuperAdmin(auth);
    const subscription = await this.subscriptionRepository.findById(subscriptionId, companyId);
    if (!subscription) throw new ResourceNotFoundError('Subscription not found');
    return toCompanySubscriptionResponse(subscription);
  }
}
