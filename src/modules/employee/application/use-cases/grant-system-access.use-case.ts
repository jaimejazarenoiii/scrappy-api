import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRole } from '../../../../shared/policy/roles.js';
import { assertEmployeeActive, assertEmployeeHasNoUser } from '../../domain/employee-rules.js';
import type { EmployeeRepository } from '../../domain/employee.repository.js';
import type { GrantSystemAccessRequestDto } from '../dto/grant-system-access.request.js';
import type { EmployeeResponseDto } from '../dto/employee.response.js';
import { toLinkedUserSummary } from '../dto/linked-user.response.js';
import {
  EMPLOYEE_ACCOUNT_AUDIT_ACTIONS,
  logEmployeeAccountAudit,
} from '../services/employee-account-audit.service.js';
import type { EmployeeAccountProvisioningService } from '../services/employee-account-provisioning.service.js';

export class GrantSystemAccessUseCase {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly provisioningService: EmployeeAccountProvisioningService,
  ) {}

  async execute(
    employeeId: string,
    companyId: string,
    actorRole: UserRole,
    input: GrantSystemAccessRequestDto,
    actorUserId?: string,
  ): Promise<EmployeeResponseDto> {
    const employee = await this.employeeRepository.findById(employeeId, companyId);
    if (!employee) throw new ResourceNotFoundError('Employee not found');
    assertEmployeeActive(employee);
    assertEmployeeHasNoUser(employee);

    const result = await this.provisioningService.grantAccountToEmployee(
      actorRole,
      employeeId,
      companyId,
      input,
    );

    logEmployeeAccountAudit({
      action: EMPLOYEE_ACCOUNT_AUDIT_ACTIONS.ACCESS_GRANTED,
      companyId,
      resourceType: 'employee',
      resourceId: employeeId,
      actorUserId,
      metadata: { userId: result.user.id, role: result.user.role },
    });

    return {
      ...result.employee.toPrimitives(),
      linkedUser: toLinkedUserSummary(result.user),
    };
  }
}
