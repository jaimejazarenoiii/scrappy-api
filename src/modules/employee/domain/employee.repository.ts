import type { UserRole } from '../../../shared/policy/roles.js';
import type { UserEntity } from '../../user/domain/user.entity.js';
import type { EmployeeEntity } from './employee.entity.js';

export interface CreateEmployeeInput {
  id: string;
  companyId: string;
  userId?: string | null;
  employeeNumber?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  suffix?: string | null;
  contactNumber?: string | null;
  weeklySalary: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateEmployeeInput {
  userId?: string | null;
  employeeNumber?: string | null;
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  suffix?: string | null;
  contactNumber?: string | null;
  weeklySalary?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface LinkedAccountInput {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface EmployeeWithLinkedUser {
  employee: EmployeeEntity;
  user: UserEntity;
}

export interface EmployeeRepository {
  create(input: CreateEmployeeInput): Promise<EmployeeEntity>;
  findById(employeeId: string, companyId: string): Promise<EmployeeEntity | null>;
  update(
    employeeId: string,
    companyId: string,
    input: UpdateEmployeeInput,
  ): Promise<EmployeeEntity>;
  softDelete(employeeId: string, companyId: string): Promise<EmployeeEntity>;
  linkUser(employeeId: string, companyId: string, userId: string): Promise<EmployeeEntity>;
  listActiveByCompany(companyId: string): Promise<EmployeeEntity[]>;
  findByIds(employeeIds: string[], companyId: string): Promise<EmployeeEntity[]>;
  /** Atomically creates an Employee and linked User account. */
  createWithLinkedAccount(
    employee: CreateEmployeeInput,
    account: LinkedAccountInput,
  ): Promise<EmployeeWithLinkedUser>;
  /** Atomically creates a User and links it to an existing Employee. */
  grantLinkedAccount(
    employeeId: string,
    companyId: string,
    account: LinkedAccountInput,
  ): Promise<EmployeeWithLinkedUser>;
}
