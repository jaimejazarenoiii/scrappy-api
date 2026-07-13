import type { CompanySubscription } from '@prisma/client';
import {
  CompanySubscriptionEntity as CompanySubscriptionModel,
  type CompanySubscriptionEntity,
} from '../../domain/company-subscription.entity.js';

export function toCompanySubscriptionDomain(
  record: CompanySubscription,
): CompanySubscriptionEntity {
  return CompanySubscriptionModel.create({
    id: record.id,
    companyId: record.companyId,
    planName: record.planName,
    startsAt: record.startsAt,
    endsAt: record.endsAt,
    status: record.status,
    notes: record.notes,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}
