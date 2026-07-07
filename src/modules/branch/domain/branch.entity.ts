import type { BranchStatus } from './branch-status.js';
import { isOperationallyEligible } from '../../../shared/organization/operational-eligibility.js';

export interface BranchProps {
  id: string;
  companyId: string;
  name: string;
  address: string;
  contactNumber: string;
  status: BranchStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
}

export class BranchEntity {
  private constructor(private readonly props: BranchProps) {}

  static create(props: BranchProps): BranchEntity {
    return new BranchEntity(props);
  }

  get id(): string {
    return this.props.id;
  }
  get companyId(): string {
    return this.props.companyId;
  }
  get name(): string {
    return this.props.name;
  }
  get status(): BranchStatus {
    return this.props.status;
  }
  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }

  isActive(): boolean {
    return this.props.status === 'ACTIVE' && !this.isDeleted();
  }

  isOperationallyEligible(): boolean {
    return isOperationallyEligible(this.props);
  }

  belongsToCompany(companyId: string): boolean {
    return this.props.companyId === companyId;
  }

  toPrimitives(): BranchProps {
    return { ...this.props };
  }
}
