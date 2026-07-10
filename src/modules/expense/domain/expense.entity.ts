import type { UserRole } from '../../../shared/policy/roles.js';
import type { ExpenseStatus } from './expense-status.js';
import type { ExpenseContextType } from './expense-context-type.js';

export interface ExpenseProps {
  id: string;
  companyId: string;
  expenseNumber: string;
  expenseDate: Date;
  category: string;
  amount: number;
  description: string;
  status: ExpenseStatus;
  contextType: ExpenseContextType;
  branchId: string | null;
  warehouseId: string | null;
  vehicleId: string | null;
  tripId: string | null;
  createdByUserId: string;
  createdByEmployeeId: string | null;
  updatedByUserId: string | null;
  recordedByUserId: string | null;
  recordedAt: Date | null;
  cancelledByUserId: string | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class ExpenseEntity {
  private constructor(private readonly props: ExpenseProps) {}

  static create(props: ExpenseProps): ExpenseEntity {
    return new ExpenseEntity(props);
  }

  get id(): string {
    return this.props.id;
  }
  get companyId(): string {
    return this.props.companyId;
  }
  get expenseNumber(): string {
    return this.props.expenseNumber;
  }
  get status(): ExpenseStatus {
    return this.props.status;
  }
  get createdByEmployeeId(): string | null {
    return this.props.createdByEmployeeId;
  }
  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  isDraft(): boolean {
    return this.props.status === 'DRAFT';
  }

  isRecorded(): boolean {
    return this.props.status === 'RECORDED';
  }

  isCancelled(): boolean {
    return this.props.status === 'CANCELLED';
  }

  isArchived(): boolean {
    return this.props.deletedAt !== null;
  }

  isOwnedByEmployee(employeeId: string): boolean {
    return this.props.createdByEmployeeId === employeeId;
  }

  isEditableBy(role: UserRole, isOwner: boolean): boolean {
    if (this.isArchived() || this.isCancelled()) return false;
    if (role === 'OWNER' || role === 'MANAGER') {
      return this.isDraft() || this.isRecorded();
    }
    return isOwner && this.isDraft();
  }

  areAttachmentsEditableBy(role: UserRole, isOwner: boolean): boolean {
    if (this.isArchived() || this.isCancelled()) return false;
    if (role === 'OWNER' || role === 'MANAGER') {
      return this.isDraft() || this.isRecorded();
    }
    return isOwner && this.isDraft();
  }

  toPrimitives(): ExpenseProps {
    return { ...this.props };
  }
}
