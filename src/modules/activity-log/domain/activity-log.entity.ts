export type ActivityEventType =
  | 'AUTHENTICATION'
  | 'COMPANY'
  | 'EMPLOYEE'
  | 'ORGANIZATION'
  | 'TRANSACTION'
  | 'TRIP'
  | 'EXPENSE'
  | 'WORKFORCE'
  | 'TRACKING';

export type ActivityModule =
  | 'auth'
  | 'company'
  | 'employee'
  | 'branch'
  | 'warehouse'
  | 'vehicle'
  | 'transaction'
  | 'trip'
  | 'expense'
  | 'attendance'
  | 'leave'
  | 'cash-advance'
  | 'payroll'
  | 'user'
  | 'tracking';

export interface ActivityLogProps {
  id: string;
  companyId: string;
  eventType: ActivityEventType | string;
  module: ActivityModule | string;
  action: string;
  description: string;
  userId: string;
  employeeId: string | null;
  resourceType: string | null;
  resourceId: string | null;
  resourceNumber: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export class ActivityLogEntity {
  private constructor(private readonly props: ActivityLogProps) {}

  static create(props: ActivityLogProps): ActivityLogEntity {
    return new ActivityLogEntity(props);
  }

  get id(): string {
    return this.props.id;
  }
  get companyId(): string {
    return this.props.companyId;
  }
  get eventType(): string {
    return this.props.eventType;
  }
  get module(): string {
    return this.props.module;
  }
  get action(): string {
    return this.props.action;
  }
  get description(): string {
    return this.props.description;
  }
  get userId(): string {
    return this.props.userId;
  }
  get employeeId(): string | null {
    return this.props.employeeId;
  }
  get resourceType(): string | null {
    return this.props.resourceType;
  }
  get resourceId(): string | null {
    return this.props.resourceId;
  }
  get resourceNumber(): string | null {
    return this.props.resourceNumber;
  }
  get ipAddress(): string | null {
    return this.props.ipAddress;
  }
  get userAgent(): string | null {
    return this.props.userAgent;
  }
  get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  toPrimitives(): ActivityLogProps {
    return { ...this.props };
  }
}
