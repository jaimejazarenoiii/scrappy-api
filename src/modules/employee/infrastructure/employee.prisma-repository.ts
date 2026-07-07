import type { Employee } from '@prisma/client';
import { prisma } from '../../../database/prisma.client.js';
import { ResourceNotFoundError } from '../../../shared/errors/http-exceptions.js';
import { EmployeeEntity as EmployeeModel, type EmployeeEntity } from '../domain/employee.entity.js';
import type {
  CreateEmployeeInput,
  EmployeeRepository,
  UpdateEmployeeInput,
} from '../domain/employee.repository.js';

function toDomain(record: Employee): EmployeeEntity {
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

export class EmployeePrismaRepository implements EmployeeRepository {
  async create(input: CreateEmployeeInput): Promise<EmployeeEntity> {
    return toDomain(
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
    return record ? toDomain(record) : null;
  }

  async update(
    employeeId: string,
    companyId: string,
    input: UpdateEmployeeInput,
  ): Promise<EmployeeEntity> {
    const existing = await this.findById(employeeId, companyId);
    if (!existing) throw new ResourceNotFoundError('Employee not found');
    return toDomain(await prisma.employee.update({ where: { id: employeeId }, data: input }));
  }

  async softDelete(employeeId: string, companyId: string): Promise<EmployeeEntity> {
    const existing = await this.findById(employeeId, companyId);
    if (!existing) throw new ResourceNotFoundError('Employee not found');
    return toDomain(
      await prisma.employee.update({
        where: { id: employeeId },
        data: { deletedAt: new Date(), status: 'INACTIVE' },
      }),
    );
  }

  async linkUser(employeeId: string, companyId: string, userId: string): Promise<EmployeeEntity> {
    const existing = await this.findById(employeeId, companyId);
    if (!existing) throw new ResourceNotFoundError('Employee not found');
    return toDomain(await prisma.employee.update({ where: { id: employeeId }, data: { userId } }));
  }

  async listActiveByCompany(companyId: string): Promise<EmployeeEntity[]> {
    const records = await prisma.employee.findMany({
      where: { companyId, status: 'ACTIVE', deletedAt: null },
    });
    return records.map(toDomain);
  }
}
