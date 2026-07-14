import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import { assertSuperAdmin } from '../../../subscription/application/policies/subscription-authorization.policy.js';
import type { CompanyRepository } from '../../domain/company.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { EmployeeRepository } from '../../../employee/domain/employee.repository.js';
import type { UserRole } from '../../../../shared/policy/roles.js';
import type { UserStatus } from '../../../user/domain/user.entity.js';

export interface AdminCompanyAccountDto {
  userId: string;
  employeeId: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName: string | null;
  lastName: string | null;
  passwordChangeRequired: boolean;
  lastLoginAt: string | null;
}

export class AdminListCompanyAccountsUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly userRepository: UserRepository,
    private readonly employeeRepository: EmployeeRepository,
  ) {}

  async execute(auth: AuthorizationContext, companyId: string): Promise<AdminCompanyAccountDto[]> {
    assertSuperAdmin(auth);
    const company = await this.companyRepository.findById(companyId);
    if (!company || company.isDeleted()) {
      throw new ResourceNotFoundError('Company not found');
    }

    const users = await this.userRepository.listByCompanyId(companyId);
    const tenantUsers = users.filter((user) => user.role !== 'SUPER_ADMIN');
    const employeeIds = tenantUsers
      .map((user) => user.employeeId)
      .filter((id): id is string => Boolean(id));
    const employees = employeeIds.length
      ? await this.employeeRepository.findByIds(employeeIds, companyId)
      : [];
    const employeesById = new Map(employees.map((employee) => [employee.id, employee]));

    return tenantUsers.map((user) => {
      const employee = user.employeeId ? employeesById.get(user.employeeId) : undefined;
      const primitives = employee?.toPrimitives();
      return {
        userId: user.id,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
        status: user.status,
        firstName: primitives?.firstName ?? null,
        lastName: primitives?.lastName ?? null,
        passwordChangeRequired: user.passwordChangeRequired,
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
      };
    });
  }
}
