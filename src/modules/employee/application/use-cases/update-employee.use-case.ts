import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { EmployeeRepository } from '../../domain/employee.repository.js';
import type { UpdateEmployeeRequestDto } from '../dto/update-employee.request.js';
import type { EmployeeResponseDto } from '../dto/employee.response.js';

function toResponse(employee: { toPrimitives(): EmployeeResponseDto }): EmployeeResponseDto {
  return employee.toPrimitives();
}

export class UpdateEmployeeUseCase {
  constructor(private readonly employeeRepository: EmployeeRepository) {}
  async execute(
    employeeId: string,
    companyId: string,
    input: UpdateEmployeeRequestDto,
  ): Promise<EmployeeResponseDto> {
    const found = await this.employeeRepository.findById(employeeId, companyId);
    if (!found) throw new ResourceNotFoundError('Employee not found');
    return toResponse(await this.employeeRepository.update(employeeId, companyId, input));
  }
}
