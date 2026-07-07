import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { EmployeeRepository } from '../../domain/employee.repository.js';
import type { EmployeeResponseDto } from '../dto/employee.response.js';

function toResponse(employee: { toPrimitives(): EmployeeResponseDto }): EmployeeResponseDto {
  return employee.toPrimitives();
}

export class GetEmployeeUseCase {
  constructor(private readonly employeeRepository: EmployeeRepository) {}
  async execute(employeeId: string, companyId: string): Promise<EmployeeResponseDto> {
    const employee = await this.employeeRepository.findById(employeeId, companyId);
    if (!employee) throw new ResourceNotFoundError('Employee not found');
    return toResponse(employee);
  }
}
