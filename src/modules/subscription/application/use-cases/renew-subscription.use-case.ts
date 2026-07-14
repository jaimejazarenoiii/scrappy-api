import { randomUUID } from 'node:crypto';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import {
  ResourceNotFoundError,
  ValidationAppError,
} from '../../../../shared/errors/http-exceptions.js';
import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import type { CompanySubscriptionStatus } from '../../../company/domain/company-subscription-status.js';
import type { CompanySubscriptionRepository } from '../../domain/company-subscription.repository.js';
import { activationTimestampForStatus } from '../../domain/subscription-period-activation.js';
import { assertNoOverlap } from '../../domain/subscription-overlap.service.js';
import type {
  CreateSubscriptionResponseDto,
  RenewSubscriptionRequestDto,
} from '../dto/subscription.dto.js';
import { toCompanySubscriptionResponse } from '../dto/subscription.dto.js';
import { assertSuperAdmin } from '../policies/subscription-authorization.policy.js';
import { SubscriptionAccountCascadeService } from '../services/subscription-account-cascade.service.js';
import {
  SUBSCRIPTION_AUDIT_ACTIONS,
  logSubscriptionAudit,
} from '../services/subscription-audit.service.js';

export class RenewSubscriptionUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly subscriptionRepository: CompanySubscriptionRepository,
    private readonly cascadeService: SubscriptionAccountCascadeService,
  ) {}

  async execute(
    auth: AuthorizationContext,
    companyId: string,
    input: RenewSubscriptionRequestDto,
  ): Promise<CreateSubscriptionResponseDto> {
    assertSuperAdmin(auth);
    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new ResourceNotFoundError('Company not found');

    const periodStatus = input.status ?? 'ACTIVE';
    const existing = await this.subscriptionRepository.listAllByCompany(companyId);
    try {
      assertNoOverlap({ startsAt: input.startsAt, endsAt: input.endsAt }, existing);
    } catch {
      throw new ValidationAppError('Subscription period overlaps an existing period');
    }

    const active = await this.subscriptionRepository.findActiveByCompany(companyId);
    if (active) {
      await this.subscriptionRepository.updateStatus(active.id, companyId, 'EXPIRED', {
        updatedBy: auth.userId,
      });
    }

    const subscription = await this.subscriptionRepository.create({
      id: randomUUID(),
      companyId,
      planName: input.planName.trim(),
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      status: periodStatus,
      notes: input.notes?.trim() ?? null,
      createdBy: auth.userId,
      activatedAt: activationTimestampForStatus(periodStatus),
    });

    const subscriptionStatus: CompanySubscriptionStatus = input.companyStatus ?? 'ACTIVE';
    await this.cascadeService.applyForSubscriptionStatus(companyId, subscriptionStatus);

    logSubscriptionAudit({
      action: SUBSCRIPTION_AUDIT_ACTIONS.RENEWED,
      companyId,
      actorUserId: auth.userId,
      resourceType: 'subscription',
      resourceId: subscription.id,
      metadata: {
        planName: subscription.planName,
        subscriptionStatus,
        priorActiveId: active?.id ?? null,
      },
    });

    return {
      subscription: toCompanySubscriptionResponse(subscription),
      subscriptionStatus,
    };
  }
}
