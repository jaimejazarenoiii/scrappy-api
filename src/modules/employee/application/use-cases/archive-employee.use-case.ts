import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { EmployeeRepository } from '../../domain/employee.repository.js';
import type { EmployeeResponseDto } from '../dto/employee.response.js';
import { logEmployeeAudit } from '../services/employee-audit.service.js';

function toResponse(employee: { toPrimitives(): EmployeeResponseDto }): EmployeeResponseDto {
  return employee.toPrimitives();
}

export class ArchiveEmployeeUseCase {
  constructor(private readonly employeeRepository: EmployeeRepository) {}
  async execute(
    employeeId: string,
    companyId: string,
    actorUserId?: string,
  ): Promise<EmployeeResponseDto> {
    const found = await this.employeeRepository.findById(employeeId, companyId);
    if (!found) throw new ResourceNotFoundError('Employee not found');
    const archived = await this.employeeRepository.softDelete(employeeId, companyId);
    logEmployeeAudit({
      action: 'employee.archived',
      companyId,
      resourceType: 'employee',
      resourceId: employeeId,
      actorUserId,
      metadata: {
        employeeName: archived.fullName,
        employeeId,
      },
    });
    return toResponse(archived);
  }
}
