import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import type {
  SuspendCompanyRequestDto,
  SubscriptionStatusResponseDto,
} from '../dto/subscription.dto.js';
import { assertSuperAdmin } from '../policies/subscription-authorization.policy.js';
import { SubscriptionAccountCascadeService } from '../services/subscription-account-cascade.service.js';
import {
  SUBSCRIPTION_AUDIT_ACTIONS,
  logSubscriptionAudit,
} from '../services/subscription-audit.service.js';

export class SuspendCompanySubscriptionUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly cascadeService: SubscriptionAccountCascadeService,
  ) {}

  async execute(
    auth: AuthorizationContext,
    companyId: string,
    _input: SuspendCompanyRequestDto = {},
  ): Promise<SubscriptionStatusResponseDto> {
    assertSuperAdmin(auth);
    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new ResourceNotFoundError('Company not found');

    await this.cascadeService.applyForSubscriptionStatus(companyId, 'SUSPENDED');

    logSubscriptionAudit({
      action: SUBSCRIPTION_AUDIT_ACTIONS.SUSPENDED,
      companyId,
      actorUserId: auth.userId,
      resourceType: 'company',
      resourceId: companyId,
      metadata: { subscriptionStatus: 'SUSPENDED' },
    });

    return { companyId, subscriptionStatus: 'SUSPENDED' };
  }
}
