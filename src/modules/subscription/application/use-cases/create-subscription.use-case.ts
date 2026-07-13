import { randomUUID } from 'node:crypto';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import {
  BusinessRuleViolationError,
  ResourceNotFoundError,
  ValidationAppError,
} from '../../../../shared/errors/http-exceptions.js';
import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import type { CompanySubscriptionStatus } from '../../../company/domain/company-subscription-status.js';
import type { CompanySubscriptionRepository } from '../../domain/company-subscription.repository.js';
import { assertNoOverlap } from '../../domain/subscription-overlap.service.js';
import type {
  CreateSubscriptionRequestDto,
  CreateSubscriptionResponseDto,
} from '../dto/subscription.dto.js';
import { toCompanySubscriptionResponse } from '../dto/subscription.dto.js';
import { assertSuperAdmin } from '../policies/subscription-authorization.policy.js';
import { SubscriptionAccountCascadeService } from '../services/subscription-account-cascade.service.js';
import {
  SUBSCRIPTION_AUDIT_ACTIONS,
  logSubscriptionAudit,
} from '../services/subscription-audit.service.js';

function resolveCompanyStatus(
  periodStatus: CreateSubscriptionRequestDto['status'],
  requested?: CompanySubscriptionStatus,
): CompanySubscriptionStatus {
  if (requested) return requested;
  if (periodStatus === 'ACTIVE') return 'ACTIVE';
  return 'TRIAL';
}

export class CreateSubscriptionUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly subscriptionRepository: CompanySubscriptionRepository,
    private readonly cascadeService: SubscriptionAccountCascadeService,
  ) {}

  async execute(
    auth: AuthorizationContext,
    companyId: string,
    input: CreateSubscriptionRequestDto,
  ): Promise<CreateSubscriptionResponseDto> {
    assertSuperAdmin(auth);
    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new ResourceNotFoundError('Company not found');

    const existing = await this.subscriptionRepository.listAllByCompany(companyId);
    try {
      assertNoOverlap({ startsAt: input.startsAt, endsAt: input.endsAt }, existing);
    } catch {
      throw new ValidationAppError('Subscription period overlaps an existing period');
    }

    if (input.status === 'ACTIVE') {
      const active = await this.subscriptionRepository.findActiveByCompany(companyId);
      if (active) {
        throw new BusinessRuleViolationError('Company already has an ACTIVE subscription period');
      }
    }

    const subscription = await this.subscriptionRepository.create({
      id: randomUUID(),
      companyId,
      planName: input.planName.trim(),
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      status: input.status,
      notes: input.notes?.trim() ?? null,
      createdBy: auth.userId,
    });

    const subscriptionStatus = resolveCompanyStatus(input.status, input.companyStatus);
    await this.cascadeService.applyForSubscriptionStatus(companyId, subscriptionStatus);

    logSubscriptionAudit({
      action: SUBSCRIPTION_AUDIT_ACTIONS.CREATED,
      companyId,
      actorUserId: auth.userId,
      resourceType: 'subscription',
      resourceId: subscription.id,
      metadata: {
        planName: subscription.planName,
        subscriptionStatus,
        periodStatus: subscription.status,
      },
    });

    return {
      subscription: toCompanySubscriptionResponse(subscription),
      subscriptionStatus,
    };
  }
}
