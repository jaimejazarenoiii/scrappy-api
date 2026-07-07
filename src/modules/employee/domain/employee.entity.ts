import type { EmployeeStatus } from './employee-status.js';

export interface EmployeeProps {
  id: string;
  companyId: string;
  userId: string | null;
  employeeNumber: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;
  contactNumber: string | null;
  weeklySalary: number;
  status: EmployeeStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class EmployeeEntity {
  private constructor(private readonly props: EmployeeProps) {}

  static create(props: EmployeeProps): EmployeeEntity {
    return new EmployeeEntity(props);
  }

  get id(): string {
    return this.props.id;
  }
  get companyId(): string {
    return this.props.companyId;
  }
  get userId(): string | null {
    return this.props.userId;
  }
  get employeeNumber(): string | null {
    return this.props.employeeNumber;
  }
  get status(): EmployeeStatus {
    return this.props.status;
  }
  get weeklySalary(): number {
    return this.props.weeklySalary;
  }
  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  get fullName(): string {
    return [this.props.firstName, this.props.middleName, this.props.lastName, this.props.suffix]
      .filter(Boolean)
      .join(' ');
  }

  isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }
  isActive(): boolean {
    return this.props.status === 'ACTIVE' && !this.isDeleted();
  }
  belongsToCompany(companyId: string): boolean {
    return this.props.companyId == companyId;
  }
  isLinkedToUser(): boolean {
    return this.props.userId !== null;
  }

  toPrimitives(): EmployeeProps {
    return { ...this.props };
  }
}
