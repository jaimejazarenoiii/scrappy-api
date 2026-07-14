import type { SubscriptionPeriodStatus } from './subscription-period-status.js';
import { isClosedPeriodStatus } from './subscription-period-status.js';

export interface CompanySubscriptionProps {
  id: string;
  companyId: string;
  planName: string;
  startsAt: Date;
  endsAt: Date;
  activatedAt: Date | null;
  status: SubscriptionPeriodStatus;
  notes: string | null;
  createdBy: string;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class CompanySubscriptionEntity {
  private constructor(private readonly props: CompanySubscriptionProps) {}

  static create(props: CompanySubscriptionProps): CompanySubscriptionEntity {
    return new CompanySubscriptionEntity(props);
  }

  get id(): string {
    return this.props.id;
  }
  get companyId(): string {
    return this.props.companyId;
  }
  get planName(): string {
    return this.props.planName;
  }
  get startsAt(): Date {
    return this.props.startsAt;
  }
  get endsAt(): Date {
    return this.props.endsAt;
  }
  get activatedAt(): Date | null {
    return this.props.activatedAt;
  }
  get status(): SubscriptionPeriodStatus {
    return this.props.status;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get createdBy(): string {
    return this.props.createdBy;
  }
  get updatedBy(): string | null {
    return this.props.updatedBy;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  belongsToCompany(companyId: string): boolean {
    return this.props.companyId === companyId;
  }

  isClosed(): boolean {
    return isClosedPeriodStatus(this.props.status);
  }

  isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }

  toPrimitives(): CompanySubscriptionProps {
    return { ...this.props };
  }
}
