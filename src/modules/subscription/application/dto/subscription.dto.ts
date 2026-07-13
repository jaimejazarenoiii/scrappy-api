import type { CompanySubscriptionStatus } from '../../../company/domain/company-subscription-status.js';
import type { SubscriptionPeriodStatus } from '../../domain/subscription-period-status.js';
import type { CompanySubscriptionEntity } from '../../domain/company-subscription.entity.js';

export interface CreateSubscriptionRequestDto {
  planName: string;
  startsAt: Date;
  endsAt: Date;
  status: Extract<SubscriptionPeriodStatus, 'PENDING' | 'ACTIVE'>;
  companyStatus?: CompanySubscriptionStatus;
  notes?: string;
}

export interface RenewSubscriptionRequestDto {
  planName: string;
  startsAt: Date;
  endsAt: Date;
  status?: Extract<SubscriptionPeriodStatus, 'PENDING' | 'ACTIVE'>;
  companyStatus?: CompanySubscriptionStatus;
  notes?: string;
}

export interface ExpireSubscriptionRequestDto {
  notes?: string;
}

export interface SuspendCompanyRequestDto {
  notes?: string;
}

export interface CompanySubscriptionResponseDto {
  id: string;
  companyId: string;
  planName: string;
  startsAt: string;
  endsAt: string;
  status: SubscriptionPeriodStatus;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionStatusResponseDto {
  companyId: string;
  subscriptionStatus: CompanySubscriptionStatus;
}

export interface CreateSubscriptionResponseDto {
  subscription: CompanySubscriptionResponseDto;
  subscriptionStatus: CompanySubscriptionStatus;
}

export function toCompanySubscriptionResponse(
  entity: CompanySubscriptionEntity,
): CompanySubscriptionResponseDto {
  return {
    id: entity.id,
    companyId: entity.companyId,
    planName: entity.planName,
    startsAt: entity.startsAt.toISOString(),
    endsAt: entity.endsAt.toISOString(),
    status: entity.status,
    notes: entity.notes,
    createdBy: entity.createdBy,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
