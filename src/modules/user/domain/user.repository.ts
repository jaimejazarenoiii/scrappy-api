import type { UserRole } from '../../../shared/policy/roles.js';
import type { UserEntity, UserStatus } from './user.entity.js';

export interface CreateUserInput {
  id: string;
  companyId: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  employeeId?: string | null;
  status?: UserStatus;
  passwordChangeRequired?: boolean;
  passwordChangedAt?: Date | null;
}

export interface UpdatePasswordOptions {
  passwordChangeRequired: boolean;
  passwordChangedAt: Date;
}

export interface UserRepository {
  create(input: CreateUserInput): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(userId: string, companyId: string): Promise<UserEntity | null>;
  updateLastLogin(userId: string): Promise<void>;
  linkEmployee(userId: string, employeeId: string): Promise<UserEntity>;
  updateStatus(userId: string, companyId: string, status: UserStatus): Promise<UserEntity>;
  updatePassword(
    userId: string,
    companyId: string,
    passwordHash: string,
    options: UpdatePasswordOptions,
  ): Promise<UserEntity>;
}
