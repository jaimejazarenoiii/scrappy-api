import type { UserRole } from '../../../shared/policy/roles.js';
import type { UserEntity } from './user.entity.js';

export interface CreateUserInput {
  id: string;
  companyId: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface UserRepository {
  create(input: CreateUserInput): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(userId: string, companyId: string): Promise<UserEntity | null>;
  updateLastLogin(userId: string): Promise<void>;
  linkEmployee(userId: string, employeeId: string): Promise<UserEntity>;
}
