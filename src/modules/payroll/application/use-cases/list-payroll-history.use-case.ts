import type { UserRole } from '../../../../shared/policy/roles.js';
import { resolveActingEmployeeId } from '../../../../shared/workforce/employee-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type {
  ListPayrollQuery,
  PayrollRecordRepository,
} from '../../domain/payroll-record.repository.js';
import type { PayrollRecordEntity } from '../../domain/payroll-record.entity.js';
import type { PayrollResponseDto } from '../dto/payroll.response.js';

function toResponse(record: PayrollRecordEntity): PayrollResponseDto {
  const { createdByUserId: _, updatedByUserId: __, ...rest } = record.toPrimitives();
  return rest;
}

export class ListPayrollHistoryUseCase {
  constructor(
    private readonly payrollRepository: PayrollRecordRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(companyId: string, userId: string, role: UserRole, query: ListPayrollQuery) {
    if (role === 'EMPLOYEE') {
      const user = await this.userRepository.findById(userId, companyId);
      if (!user) throw new ResourceNotFoundError('User not found');
      const employeeId = resolveActingEmployeeId(user);
      const result = await this.payrollRepository.listByEmployee(employeeId, companyId, query);
      return {
        items: result.items.map(toResponse),
        meta: buildPaginationMeta(query.page, query.limit, result.total),
      };
    }

    const result = await this.payrollRepository.listByCompany(companyId, query);
    return {
      items: result.items.map(toResponse),
      meta: buildPaginationMeta(query.page, query.limit, result.total),
    };
  }
}
