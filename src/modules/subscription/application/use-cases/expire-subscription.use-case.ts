import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import type { CompanySubscriptionRepository } from '../../domain/company-subscription.repository.js';
import type {
  ExpireSubscriptionRequestDto,
  SubscriptionStatusResponseDto,
} from '../dto/subscription.dto.js';
import { assertSuperAdmin } from '../policies/subscription-authorization.policy.js';
import { SubscriptionAccountCascadeService } from '../services/subscription-account-cascade.service.js';
import {
  SUBSCRIPTION_AUDIT_ACTIONS,
  logSubscriptionAudit,
} from '../services/subscription-audit.service.js';

export class ExpireSubscriptionUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly subscriptionRepository: CompanySubscriptionRepository,
    private readonly cascadeService: SubscriptionAccountCascadeService,
  ) {}

  async execute(
    auth: AuthorizationContext,
    companyId: string,
    _input: ExpireSubscriptionRequestDto = {},
  ): Promise<SubscriptionStatusResponseDto> {
    assertSuperAdmin(auth);
    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new ResourceNotFoundError('Company not found');

    const active = await this.subscriptionRepository.findActiveByCompany(companyId);
    if (active) {
      await this.subscriptionRepository.updateStatus(active.id, companyId, 'EXPIRED');
    }

    await this.cascadeService.applyForSubscriptionStatus(companyId, 'EXPIRED');

    logSubscriptionAudit({
      action: SUBSCRIPTION_AUDIT_ACTIONS.EXPIRED,
      companyId,
      actorUserId: auth.userId,
      resourceType: 'subscription',
      resourceId: active?.id,
      metadata: { subscriptionStatus: 'EXPIRED' },
    });

    return { companyId, subscriptionStatus: 'EXPIRED' };
  }
}
