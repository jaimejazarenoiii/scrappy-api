import type { UserRole } from '../../../shared/policy/roles.js';

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface UserProps {
  id: string;
  companyId: string;
  employeeId: string | null;
  email: string;
  passwordHash: string;
  role: UserRole;
  passwordChangeRequired: boolean;
  passwordChangedAt: Date | null;
  lastLoginAt: Date | null;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class UserEntity {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): UserEntity {
    return new UserEntity(props);
  }

  get id(): string {
    return this.props.id;
  }
  get companyId(): string {
    return this.props.companyId;
  }
  get employeeId(): string | null {
    return this.props.employeeId;
  }
  get email(): string {
    return this.props.email;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
  }
  get role(): UserRole {
    return this.props.role;
  }
  get passwordChangeRequired(): boolean {
    return this.props.passwordChangeRequired;
  }
  get passwordChangedAt(): Date | null {
    return this.props.passwordChangedAt;
  }
  get lastLoginAt(): Date | null {
    return this.props.lastLoginAt;
  }
  get status(): UserStatus {
    return this.props.status;
  }
  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  belongsToCompany(companyId: string): boolean {
    return this.props.companyId == companyId;
  }
  isActive(): boolean {
    return this.props.status === 'ACTIVE' && this.props.deletedAt === null;
  }
  isLinkedToEmployee(): boolean {
    return this.props.employeeId !== null;
  }

  toPrimitives(): UserProps {
    return { ...this.props };
  }
}
