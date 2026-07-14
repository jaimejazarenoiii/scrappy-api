import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import {
  BusinessRuleViolationError,
  ResourceNotFoundError,
} from '../../../../shared/errors/http-exceptions.js';
import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import type { CompanySubscriptionStatus } from '../../../company/domain/company-subscription-status.js';
import type {
  ReactivateCompanyRequestDto,
  SubscriptionStatusResponseDto,
} from '../dto/subscription.dto.js';
import { assertSuperAdmin } from '../policies/subscription-authorization.policy.js';
import { SubscriptionAccountCascadeService } from '../services/subscription-account-cascade.service.js';
import {
  SUBSCRIPTION_AUDIT_ACTIONS,
  logSubscriptionAudit,
} from '../services/subscription-audit.service.js';

export class ReactivateCompanySubscriptionUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly cascadeService: SubscriptionAccountCascadeService,
  ) {}

  async execute(
    auth: AuthorizationContext,
    companyId: string,
    input: ReactivateCompanyRequestDto = {},
  ): Promise<SubscriptionStatusResponseDto> {
    assertSuperAdmin(auth);
    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new ResourceNotFoundError('Company not found');

    if (company.subscriptionStatus !== 'SUSPENDED') {
      throw new BusinessRuleViolationError(
        'Only suspended companies can be reactivated; use renew after expiry',
      );
    }

    const subscriptionStatus: CompanySubscriptionStatus = input.companyStatus ?? 'ACTIVE';
    await this.cascadeService.applyForSubscriptionStatus(companyId, subscriptionStatus);

    logSubscriptionAudit({
      action: SUBSCRIPTION_AUDIT_ACTIONS.REACTIVATED,
      companyId,
      actorUserId: auth.userId,
      resourceType: 'company',
      resourceId: companyId,
      metadata: {
        subscriptionStatus,
        notes: input.notes?.trim() ?? null,
      },
    });

    return { companyId, subscriptionStatus };
  }
}
