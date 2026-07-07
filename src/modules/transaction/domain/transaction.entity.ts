import type { TransactionDirection } from './transaction-direction.js';
import type { TransactionStatus } from './transaction-status.js';
import type { TransactionLocationType } from './transaction-location-type.js';

export interface TransactionProps {
  id: string;
  companyId: string;
  createdByUserId: string;
  updatedByUserId: string | null;
  direction: TransactionDirection;
  status: TransactionStatus;
  partyName: string;
  partyContactNumber: string | null;
  transactionDate: Date;
  locationType: TransactionLocationType;
  branchId: string | null;
  warehouseId: string | null;
  outsideLocationName: string | null;
  outsideAddress: string | null;
  tripId: string | null;
  notes: string | null;
  cancellationReason: string | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class TransactionEntity {
  private constructor(private readonly props: TransactionProps) {}

  static create(props: TransactionProps): TransactionEntity {
    return new TransactionEntity(props);
  }

  get id(): string {
    return this.props.id;
  }
  get companyId(): string {
    return this.props.companyId;
  }
  get createdByUserId(): string {
    return this.props.createdByUserId;
  }
  get status(): TransactionStatus {
    return this.props.status;
  }
  get direction(): TransactionDirection {
    return this.props.direction;
  }
  get locationType(): TransactionLocationType {
    return this.props.locationType;
  }
  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  isDraft(): boolean {
    return this.props.status === 'DRAFT';
  }

  isCancelled(): boolean {
    return this.props.status === 'CANCELLED';
  }

  isArchived(): boolean {
    return this.props.deletedAt !== null;
  }

  isAtBranch(): boolean {
    return this.props.locationType === 'BRANCH';
  }

  isAtWarehouse(): boolean {
    return this.props.locationType === 'WAREHOUSE';
  }

  isOutside(): boolean {
    return this.props.locationType === 'OUTSIDE';
  }

  belongsToCompany(companyId: string): boolean {
    return this.props.companyId === companyId;
  }

  toPrimitives(): TransactionProps {
    return { ...this.props };
  }
}
