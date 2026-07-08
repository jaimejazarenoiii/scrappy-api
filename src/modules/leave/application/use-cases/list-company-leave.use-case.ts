import type {
  LeaveRecordRepository,
  ListLeaveQuery,
} from '../../domain/leave-record.repository.js';
import type { EmployeeRepository } from '../../../employee/domain/employee.repository.js';
import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { CompanyLeaveResponseDto } from '../dto/leave.response.js';
import {
  buildEmployeeSummaryLookup,
  withEmployeeSummary,
} from '../../../../shared/workforce/employee-summary.js';

export class ListCompanyLeaveUseCase {
  constructor(
    private readonly leaveRepository: LeaveRecordRepository,
    private readonly employeeRepository: EmployeeRepository,
  ) {}

  async execute(companyId: string, query: ListLeaveQuery) {
    const result = await this.leaveRepository.listByCompany(companyId, query);
    const employeeIds = [
      ...new Set(result.items.map((record) => record.toPrimitives().employeeId)),
    ];
    const employees = await this.employeeRepository.findByIds(employeeIds, companyId);
    const employeeLookup = buildEmployeeSummaryLookup(employees);

    const items: CompanyLeaveResponseDto[] = result.items.map((record) =>
      withEmployeeSummary(record.toPrimitives(), employeeLookup),
    );

    return {
      items,
      meta: buildPaginationMeta(query.page, query.limit, result.total),
    };
  }
}
