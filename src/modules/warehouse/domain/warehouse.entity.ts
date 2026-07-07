import type { WarehouseStatus } from './warehouse-status.js';
import { isOperationallyEligible } from '../../../shared/organization/operational-eligibility.js';

export interface WarehouseProps {
  id: string;
  companyId: string;
  name: string;
  address: string;
  contactNumber: string;
  status: WarehouseStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
}

export class WarehouseEntity {
  private constructor(private readonly props: WarehouseProps) {}

  static create(props: WarehouseProps): WarehouseEntity {
    return new WarehouseEntity(props);
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
  get status(): WarehouseStatus {
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

  toPrimitives(): WarehouseProps {
    return { ...this.props };
  }
}
