import { randomUUID } from 'node:crypto';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import { emitStructuredAudit } from '../../../../shared/audit/emit-structured-audit.js';
import type { CompanyRepository } from '../../domain/company.repository.js';
import type { EmployeeAccountProvisioningService } from '../../../employee/application/services/employee-account-provisioning.service.js';
import type { AccountCredentialsRequestDto } from '../../../employee/application/dto/account-credentials.request.js';
import type { EmployeeResponseDto } from '../../../employee/application/dto/employee.response.js';
import { toLinkedUserSummary } from '../../../employee/application/dto/linked-user.response.js';
import { assertSuperAdmin } from '../../../subscription/application/policies/subscription-authorization.policy.js';

export interface AdminCreateCompanyAccountRequestDto {
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  employeeNumber?: string;
  contactNumber?: string;
  weeklySalary: number;
  status?: 'ACTIVE' | 'INACTIVE';
  account: AccountCredentialsRequestDto;
}

export class AdminCreateCompanyAccountUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly provisioningService: EmployeeAccountProvisioningService,
  ) {}

  async execute(
    auth: AuthorizationContext,
    companyId: string,
    input: AdminCreateCompanyAccountRequestDto,
  ): Promise<EmployeeResponseDto> {
    assertSuperAdmin(auth);
    const company = await this.companyRepository.findById(companyId);
    if (!company || company.isDeleted()) {
      throw new ResourceNotFoundError('Company not found');
    }

    const result = await this.provisioningService.createEmployeeWithAccount(
      'SUPER_ADMIN',
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

    emitStructuredAudit('admin account created', {
      action: 'admin.account_created',
      companyId,
      resourceType: 'employee',
      resourceId: result.employee.id,
      actorUserId: auth.userId,
      metadata: {
        userId: result.user.id,
        role: result.user.role,
        email: result.user.email,
        employeeName: result.employee.fullName,
      },
    });

    return {
      ...result.employee.toPrimitives(),
      linkedUser: toLinkedUserSummary(result.user),
    };
  }
}
