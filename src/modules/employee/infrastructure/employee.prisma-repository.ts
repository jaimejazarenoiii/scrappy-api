import type { Employee, User } from '@prisma/client';
import { prisma } from '../../../database/prisma.client.js';
import { withTransaction } from '../../../database/prisma-transaction.js';
import { ResourceNotFoundError } from '../../../shared/errors/http-exceptions.js';
import { UserEntity as UserModel, type UserEntity } from '../../user/domain/user.entity.js';
import { EmployeeEntity as EmployeeModel, type EmployeeEntity } from '../domain/employee.entity.js';
import type {
  CreateEmployeeInput,
  EmployeeRepository,
  EmployeeWithLinkedUser,
  LinkedAccountInput,
  UpdateEmployeeInput,
} from '../domain/employee.repository.js';

function toEmployeeDomain(record: Employee): EmployeeEntity {
  return EmployeeModel.create({
    id: record.id,
    companyId: record.companyId,
    userId: record.userId,
    employeeNumber: record.employeeNumber,
    firstName: record.firstName,
    middleName: record.middleName,
    lastName: record.lastName,
    suffix: record.suffix,
    contactNumber: record.contactNumber,
    weeklySalary: Number(record.weeklySalary),
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt,
  });
}

function toUserDomain(record: User): UserEntity {
  return UserModel.create({
    id: record.id,
    companyId: record.companyId,
    employeeId: record.employeeId,
    email: record.email,
    passwordHash: record.passwordHash,
    role: record.role,
    passwordChangeRequired: record.passwordChangeRequired,
    passwordChangedAt: record.passwordChangedAt,
    lastLoginAt: record.lastLoginAt,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt,
  });
}

export class EmployeePrismaRepository implements EmployeeRepository {
  async create(input: CreateEmployeeInput): Promise<EmployeeEntity> {
    return toEmployeeDomain(
      await prisma.employee.create({
        data: {
          id: input.id,
          companyId: input.companyId,
          userId: input.userId ?? null,
          employeeNumber: input.employeeNumber ?? null,
          firstName: input.firstName,
          middleName: input.middleName ?? null,
          lastName: input.lastName,
          suffix: input.suffix ?? null,
          contactNumber: input.contactNumber ?? null,
          weeklySalary: input.weeklySalary,
          status: input.status ?? 'ACTIVE',
        },
      }),
    );
  }

  async findById(employeeId: string, companyId: string): Promise<EmployeeEntity | null> {
    const record = await prisma.employee.findFirst({
      where: { id: employeeId, companyId, deletedAt: null },
    });
    return record ? toEmployeeDomain(record) : null;
  }

  async update(
    employeeId: string,
    companyId: string,
    input: UpdateEmployeeInput,
  ): Promise<EmployeeEntity> {
    const existing = await this.findById(employeeId, companyId);
    if (!existing) throw new ResourceNotFoundError('Employee not found');
    return toEmployeeDomain(
      await prisma.employee.update({ where: { id: employeeId }, data: input }),
    );
  }

  async softDelete(employeeId: string, companyId: string): Promise<EmployeeEntity> {
    const existing = await this.findById(employeeId, companyId);
    if (!existing) throw new ResourceNotFoundError('Employee not found');
    return toEmployeeDomain(
      await prisma.employee.update({
        where: { id: employeeId },
        data: { deletedAt: new Date(), status: 'INACTIVE' },
      }),
    );
  }

  async linkUser(employeeId: string, companyId: string, userId: string): Promise<EmployeeEntity> {
    const existing = await this.findById(employeeId, companyId);
    if (!existing) throw new ResourceNotFoundError('Employee not found');
    return toEmployeeDomain(
      await prisma.employee.update({ where: { id: employeeId }, data: { userId } }),
    );
  }

  async listActiveByCompany(companyId: string): Promise<EmployeeEntity[]> {
    const records = await prisma.employee.findMany({
      where: { companyId, status: 'ACTIVE', deletedAt: null },
    });
    return records.map(toEmployeeDomain);
  }

  async findByIds(employeeIds: string[], companyId: string): Promise<EmployeeEntity[]> {
    if (employeeIds.length === 0) return [];
    const records = await prisma.employee.findMany({
      where: { id: { in: employeeIds }, companyId, deletedAt: null },
    });
    return records.map(toEmployeeDomain);
  }

  async createWithLinkedAccount(
    employee: CreateEmployeeInput,
    account: LinkedAccountInput,
  ): Promise<EmployeeWithLinkedUser> {
    return withTransaction(async (tx) => {
      const createdEmployee = await tx.employee.create({
        data: {
          id: employee.id,
          companyId: employee.companyId,
          userId: null,
          employeeNumber: employee.employeeNumber ?? null,
          firstName: employee.firstName,
          middleName: employee.middleName ?? null,
          lastName: employee.lastName,
          suffix: employee.suffix ?? null,
          contactNumber: employee.contactNumber ?? null,
          weeklySalary: employee.weeklySalary,
          status: employee.status ?? 'ACTIVE',
        },
      });
      const createdUser = await tx.user.create({
        data: {
          id: account.id,
          companyId: employee.companyId,
          email: account.email,
          passwordHash: account.passwordHash,
          role: account.role,
          employeeId: createdEmployee.id,
          status: 'ACTIVE',
        },
      });
      const linkedEmployee = await tx.employee.update({
        where: { id: createdEmployee.id },
        data: { userId: createdUser.id },
      });
      return {
        employee: toEmployeeDomain(linkedEmployee),
        user: toUserDomain(createdUser),
      };
    });
  }

  async grantLinkedAccount(
    employeeId: string,
    companyId: string,
    account: LinkedAccountInput,
  ): Promise<EmployeeWithLinkedUser> {
    return withTransaction(async (tx) => {
      const existing = await tx.employee.findFirst({
        where: { id: employeeId, companyId, deletedAt: null },
      });
      if (!existing) throw new ResourceNotFoundError('Employee not found');
      const createdUser = await tx.user.create({
        data: {
          id: account.id,
          companyId,
          email: account.email,
          passwordHash: account.passwordHash,
          role: account.role,
          employeeId,
          status: 'ACTIVE',
        },
      });
      const linkedEmployee = await tx.employee.update({
        where: { id: employeeId },
        data: { userId: createdUser.id },
      });
      return {
        employee: toEmployeeDomain(linkedEmployee),
        user: toUserDomain(createdUser),
      };
    });
  }
}
