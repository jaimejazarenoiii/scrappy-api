import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { EmployeeRepository } from '../../domain/employee.repository.js';
import type { EmployeeResponseDto } from '../dto/employee.response.js';

function toResponse(employee: { toPrimitives(): EmployeeResponseDto }): EmployeeResponseDto {
  return employee.toPrimitives();
}

export class ArchiveEmployeeUseCase {
  constructor(private readonly employeeRepository: EmployeeRepository) {}
  async execute(employeeId: string, companyId: string): Promise<EmployeeResponseDto> {
    const found = await this.employeeRepository.findById(employeeId, companyId);
    if (!found) throw new ResourceNotFoundError('Employee not found');
    return toResponse(await this.employeeRepository.softDelete(employeeId, companyId));
  }
}
