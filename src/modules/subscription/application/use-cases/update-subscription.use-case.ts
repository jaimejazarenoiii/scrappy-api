import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import {
  BusinessRuleViolationError,
  ResourceNotFoundError,
  ValidationAppError,
} from '../../../../shared/errors/http-exceptions.js';
import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import type { CompanySubscriptionRepository } from '../../domain/company-subscription.repository.js';
import { activationTimestampForStatus } from '../../domain/subscription-period-activation.js';
import { assertNoOverlap } from '../../domain/subscription-overlap.service.js';
import type {
  UpdateSubscriptionRequestDto,
  UpdateSubscriptionResponseDto,
} from '../dto/subscription.dto.js';
import { toCompanySubscriptionResponse } from '../dto/subscription.dto.js';
import { assertSuperAdmin } from '../policies/subscription-authorization.policy.js';
import { SubscriptionAccountCascadeService } from '../services/subscription-account-cascade.service.js';
import {
  SUBSCRIPTION_AUDIT_ACTIONS,
  logSubscriptionAudit,
} from '../services/subscription-audit.service.js';

export class UpdateSubscriptionUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly subscriptionRepository: CompanySubscriptionRepository,
    private readonly cascadeService: SubscriptionAccountCascadeService,
  ) {}

  async execute(
    auth: AuthorizationContext,
    companyId: string,
    subscriptionId: string,
    input: UpdateSubscriptionRequestDto,
  ): Promise<UpdateSubscriptionResponseDto> {
    assertSuperAdmin(auth);
    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new ResourceNotFoundError('Company not found');

    const existing = await this.subscriptionRepository.findById(subscriptionId, companyId);
    if (!existing) throw new ResourceNotFoundError('Subscription not found');

    const nextStartsAt = input.startsAt ?? existing.startsAt;
    const nextEndsAt = input.endsAt ?? existing.endsAt;
    const nextStatus = input.status ?? existing.status;

    const others = await this.subscriptionRepository.listAllByCompany(companyId);
    try {
      assertNoOverlap({ startsAt: nextStartsAt, endsAt: nextEndsAt }, others, subscriptionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid subscription period';
      throw new ValidationAppError(message);
    }

    if (nextStatus === 'ACTIVE') {
      const active = await this.subscriptionRepository.findActiveByCompany(companyId);
      if (active && active.id !== subscriptionId) {
        throw new BusinessRuleViolationError('Company already has an ACTIVE subscription period');
      }
    }

    const subscription = await this.subscriptionRepository.update(subscriptionId, companyId, {
      ...(input.planName !== undefined ? { planName: input.planName.trim() } : {}),
      ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
      ...(input.endsAt !== undefined ? { endsAt: input.endsAt } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
      ...(nextStatus === 'ACTIVE'
        ? { activatedAt: activationTimestampForStatus('ACTIVE', existing.activatedAt) }
        : {}),
      updatedBy: auth.userId,
    });

    let subscriptionStatus = company.subscriptionStatus;
    if (input.companyStatus) {
      subscriptionStatus = input.companyStatus;
      await this.cascadeService.applyForSubscriptionStatus(companyId, subscriptionStatus);
    } else if (nextStatus === 'ACTIVE' && existing.status !== 'ACTIVE') {
      subscriptionStatus = 'ACTIVE';
      await this.cascadeService.applyForSubscriptionStatus(companyId, subscriptionStatus);
    }

    logSubscriptionAudit({
      action: SUBSCRIPTION_AUDIT_ACTIONS.UPDATED,
      companyId,
      actorUserId: auth.userId,
      resourceType: 'subscription',
      resourceId: subscription.id,
      metadata: {
        planName: subscription.planName,
        startsAt: subscription.startsAt.toISOString(),
        endsAt: subscription.endsAt.toISOString(),
        periodStatus: subscription.status,
        subscriptionStatus,
      },
    });

    return {
      subscription: toCompanySubscriptionResponse(subscription),
      subscriptionStatus,
    };
  }
}
