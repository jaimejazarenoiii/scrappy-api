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
}
