import { randomUUID } from 'node:crypto';
import type { EmployeeRepository } from '../../domain/employee.repository.js';
import type { CreateEmployeeRequestDto } from '../dto/create-employee.request.js';
import type { EmployeeResponseDto } from '../dto/employee.response.js';

function toResponse(employee: { toPrimitives(): EmployeeResponseDto }): EmployeeResponseDto {
  return employee.toPrimitives();
}

export class CreateEmployeeUseCase {
  constructor(private readonly employeeRepository: EmployeeRepository) {}
  async execute(companyId: string, input: CreateEmployeeRequestDto): Promise<EmployeeResponseDto> {
    const employee = await this.employeeRepository.create({
      id: randomUUID(),
      companyId,
      userId: input.userId ?? null,
      employeeNumber: input.employeeNumber ?? null,
      firstName: input.firstName,
      middleName: input.middleName ?? null,
      lastName: input.lastName,
      suffix: input.suffix ?? null,
      contactNumber: input.contactNumber ?? null,
      weeklySalary: input.weeklySalary,
      status: input.status ?? 'ACTIVE',
    });
    return toResponse(employee);
  }
}
