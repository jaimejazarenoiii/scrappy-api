import type { LeaveStatus, LeaveType } from './leave-status.js';

export interface LeaveRecordProps {
  id: string;
  companyId: string;
  employeeId: string;
  leaveType: LeaveType;
  leaveDate: Date;
  status: LeaveStatus;
  reason: string | null;
  managerNote: string | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class LeaveRecordEntity {
  private constructor(private readonly props: LeaveRecordProps) {}

  static create(props: LeaveRecordProps): LeaveRecordEntity {
    return new LeaveRecordEntity(props);
  }

  get id(): string {
    return this.props.id;
  }
  get companyId(): string {
    return this.props.companyId;
  }
  get employeeId(): string {
    return this.props.employeeId;
  }
  get leaveType(): LeaveType {
    return this.props.leaveType;
  }
  get leaveDate(): Date {
    return this.props.leaveDate;
  }
  get status(): LeaveStatus {
    return this.props.status;
  }

  isCancelled(): boolean {
    return this.props.status === 'CANCELLED';
  }

  belongsToCompany(companyId: string): boolean {
    return this.props.companyId === companyId;
  }

  toPrimitives(): LeaveRecordProps {
    return { ...this.props };
  }
}
