import {
  LifecycleConflictError,
  ResourceNotFoundError,
} from '../../../../shared/errors/http-exceptions.js';
import type { SessionRepository } from '../../../session/domain/session.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import { assertEmployeeHasUser } from '../../domain/employee-rules.js';
import type { EmployeeRepository } from '../../domain/employee.repository.js';
import type { EmployeeResponseDto } from '../dto/employee.response.js';
import { toLinkedUserSummary } from '../dto/linked-user.response.js';
import {
  EMPLOYEE_ACCOUNT_AUDIT_ACTIONS,
  logEmployeeAccountAudit,
} from '../services/employee-account-audit.service.js';

export class DisableSystemAccessUseCase {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async execute(
    employeeId: string,
    companyId: string,
    actorUserId?: string,
  ): Promise<EmployeeResponseDto> {
    const employee = await this.employeeRepository.findById(employeeId, companyId);
    if (!employee) throw new ResourceNotFoundError('Employee not found');
    assertEmployeeHasUser(employee);

    const user = await this.userRepository.findById(employee.userId!, companyId);
    if (!user) throw new ResourceNotFoundError('User not found');
    if (!user.isActive()) {
      throw new LifecycleConflictError('User account is already inactive');
    }

    const updatedUser = await this.userRepository.updateStatus(user.id, companyId, 'INACTIVE');
    await this.sessionRepository.revokeAllForUser(user.id);

    logEmployeeAccountAudit({
      action: EMPLOYEE_ACCOUNT_AUDIT_ACTIONS.ACCESS_DISABLED,
      companyId,
      resourceType: 'employee',
      resourceId: employeeId,
      actorUserId,
      metadata: { userId: user.id },
    });

    return {
      ...employee.toPrimitives(),
      linkedUser: toLinkedUserSummary(updatedUser),
    };
  }
}
