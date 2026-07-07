import type { VehicleStatus } from './vehicle-status.js';
import { isOperationallyEligible } from '../../../shared/organization/operational-eligibility.js';

export interface VehicleProps {
  id: string;
  companyId: string;
  plateNumber: string;
  description: string;
  status: VehicleStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
}

export class VehicleEntity {
  private constructor(private readonly props: VehicleProps) {}

  static create(props: VehicleProps): VehicleEntity {
    return new VehicleEntity(props);
  }

  get id(): string {
    return this.props.id;
  }
  get companyId(): string {
    return this.props.companyId;
  }
  get plateNumber(): string {
    return this.props.plateNumber;
  }
  get status(): VehicleStatus {
    return this.props.status;
  }
  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }

  isAvailable(): boolean {
    return this.props.status === 'AVAILABLE' && !this.isDeleted();
  }

  isOperationallyEligible(): boolean {
    return isOperationallyEligible(this.props);
  }

  belongsToCompany(companyId: string): boolean {
    return this.props.companyId === companyId;
  }

  toPrimitives(): VehicleProps {
    return { ...this.props };
  }
}
