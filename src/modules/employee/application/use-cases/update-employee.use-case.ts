import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { EmployeeRepository } from '../../domain/employee.repository.js';
import type { UpdateEmployeeRequestDto } from '../dto/update-employee.request.js';
import type { EmployeeResponseDto } from '../dto/employee.response.js';
import { logEmployeeAudit } from '../services/employee-audit.service.js';

function toResponse(employee: { toPrimitives(): EmployeeResponseDto }): EmployeeResponseDto {
  return employee.toPrimitives();
}

export class UpdateEmployeeUseCase {
  constructor(private readonly employeeRepository: EmployeeRepository) {}
  async execute(
    employeeId: string,
    companyId: string,
    input: UpdateEmployeeRequestDto,
    actorUserId?: string,
  ): Promise<EmployeeResponseDto> {
    const found = await this.employeeRepository.findById(employeeId, companyId);
    if (!found) throw new ResourceNotFoundError('Employee not found');
    const updated = await this.employeeRepository.update(employeeId, companyId, input);
    logEmployeeAudit({
      action: 'employee.updated',
      companyId,
      resourceType: 'employee',
      resourceId: employeeId,
      actorUserId,
      metadata: {
        employeeName: updated.fullName,
        employeeId,
      },
    });
    return toResponse(updated);
  }
}
