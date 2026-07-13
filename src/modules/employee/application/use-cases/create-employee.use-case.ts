import { randomUUID } from 'node:crypto';
import type { UserRole } from '../../../../shared/policy/roles.js';
import { ValidationAppError } from '../../../../shared/errors/http-exceptions.js';
import type { EmployeeRepository } from '../../domain/employee.repository.js';
import type { CreateEmployeeRequestDto } from '../dto/create-employee.request.js';
import type { EmployeeResponseDto } from '../dto/employee.response.js';
import { toLinkedUserSummary } from '../dto/linked-user.response.js';
import {
  EMPLOYEE_ACCOUNT_AUDIT_ACTIONS,
  logEmployeeAccountAudit,
} from '../services/employee-account-audit.service.js';
import type { EmployeeAccountProvisioningService } from '../services/employee-account-provisioning.service.js';

function toResponse(
  employee: { toPrimitives(): Omit<EmployeeResponseDto, 'linkedUser'> },
  linkedUser?: EmployeeResponseDto['linkedUser'],
): EmployeeResponseDto {
  return {
    ...employee.toPrimitives(),
    ...(linkedUser !== undefined ? { linkedUser } : {}),
  };
}

export class CreateEmployeeUseCase {
  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly provisioningService?: EmployeeAccountProvisioningService,
  ) {}

  async execute(
    companyId: string,
    input: CreateEmployeeRequestDto,
    actorRole: UserRole = 'OWNER',
    actorUserId?: string,
  ): Promise<EmployeeResponseDto> {
    const createAccount = input.createAccount === true;
    if (createAccount && input.userId) {
      throw new ValidationAppError('createAccount cannot be combined with userId', [
        { path: 'userId', message: 'Omit userId when createAccount is true.' },
      ]);
    }
    if (createAccount) {
      if (!input.account || !this.provisioningService) {
        throw new ValidationAppError('account is required when createAccount is true', [
          { path: 'account', message: 'Provide email, password, confirmPassword, and role.' },
        ]);
      }
      const result = await this.provisioningService.createEmployeeWithAccount(
        actorRole,
        {
          id: randomUUID(),
          companyId,
          employeeNumber: input.employeeNumber ?? null,
          firstName: input.firstName,
          middleName: input.middleName ?? null,
          lastName: input.lastName,
          suffix: input.suffix ?? null,
          contactNumber: input.contactNumber ?? null,
          weeklySalary: input.weeklySalary,
          status: input.status ?? 'ACTIVE',
        },
        input.account,
      );
      logEmployeeAccountAudit({
        action: EMPLOYEE_ACCOUNT_AUDIT_ACTIONS.PROVISIONED_ON_CREATE,
        companyId,
        resourceType: 'employee',
        resourceId: result.employee.id,
        actorUserId,
        metadata: { userId: result.user.id, role: result.user.role },
      });
      return toResponse(result.employee, toLinkedUserSummary(result.user));
    }

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
    return toResponse(employee, null);
  }
}
