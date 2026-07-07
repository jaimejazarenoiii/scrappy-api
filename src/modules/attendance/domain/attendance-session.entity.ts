import type { AttendanceSessionStatus } from './attendance-status.js';

export interface AttendanceSessionProps {
  id: string;
  companyId: string;
  employeeId: string;
  status: AttendanceSessionStatus;
  timeInAt: Date;
  timeOutAt: Date | null;
  note: string | null;
  correctionNote: string | null;
  adjustedTimeInAt: Date | null;
  adjustedTimeOutAt: Date | null;
  createdByUserId: string | null;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AttendanceSessionEntity {
  private constructor(private readonly props: AttendanceSessionProps) {}

  static create(props: AttendanceSessionProps): AttendanceSessionEntity {
    return new AttendanceSessionEntity(props);
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
  get status(): AttendanceSessionStatus {
    return this.props.status;
  }
  get timeInAt(): Date {
    return this.props.timeInAt;
  }
  get timeOutAt(): Date | null {
    return this.props.timeOutAt;
  }

  isOpen(): boolean {
    return this.props.status === 'OPEN';
  }

  isClosed(): boolean {
    return this.props.status === 'CLOSED';
  }

  belongsToCompany(companyId: string): boolean {
    return this.props.companyId === companyId;
  }

  close(timeOutAt: Date, note?: string | null): AttendanceSessionEntity {
    return AttendanceSessionEntity.create({
      ...this.props,
      status: 'CLOSED',
      timeOutAt,
      note: note ?? this.props.note,
      updatedAt: new Date(),
    });
  }

  toPrimitives(): AttendanceSessionProps {
    return { ...this.props };
  }
}
