import type { TransactionDirection } from './transaction-direction.js';
import type { TransactionStatus } from './transaction-status.js';
import type { TransactionLocationType } from './transaction-location-type.js';
import type { UserRole } from '../../../shared/policy/roles.js';

export interface TransactionProps {
  id: string;
  companyId: string;
  createdByUserId: string;
  updatedByUserId: string | null;
  transactionNumber: string;
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
  submittedAt: Date | null;
  submittedByUserId: string | null;
  paidAt: Date | null;
  paidByUserId: string | null;
  cancellationReason: string | null;
  cancelledAt: Date | null;
  cancelledByUserId: string | null;
  reopenedAt: Date | null;
  reopenedByUserId: string | null;
  reopenReason: string | null;
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
  get transactionNumber(): string {
    return this.props.transactionNumber;
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

  isReadyForPayment(): boolean {
    return this.props.status === 'READY_FOR_PAYMENT';
  }

  isPaid(): boolean {
    return this.props.status === 'PAID';
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

  isEditableBy(role: UserRole, isAssigned: boolean): boolean {
    if (this.isArchived() || this.isCancelled()) return false;
    if (this.isPaid()) return false;
    if (this.isDraft()) {
      return role === 'OWNER' || role === 'MANAGER' || isAssigned;
    }
    if (this.isReadyForPayment()) {
      return role === 'OWNER' || role === 'MANAGER';
    }
    return false;
  }

  toPrimitives(): TransactionProps {
    return { ...this.props };
  }
}
