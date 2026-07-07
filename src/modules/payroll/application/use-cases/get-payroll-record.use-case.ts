import type { UserRole } from '../../../../shared/policy/roles.js';
import { resolveActingEmployeeId } from '../../../../shared/workforce/employee-context.js';
import {
  ForbiddenError,
  ResourceNotFoundError,
} from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { PayrollRecordRepository } from '../../domain/payroll-record.repository.js';
import type { PayrollRecordEntity } from '../../domain/payroll-record.entity.js';
import type { PayrollResponseDto } from '../dto/payroll.response.js';

function toResponse(record: PayrollRecordEntity): PayrollResponseDto {
  const { createdByUserId: _, updatedByUserId: __, ...rest } = record.toPrimitives();
  return rest;
}

export class GetPayrollRecordUseCase {
  constructor(
    private readonly payrollRepository: PayrollRecordRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    payrollId: string,
    companyId: string,
    userId: string,
    role: UserRole,
  ): Promise<PayrollResponseDto> {
    const record = await this.payrollRepository.findById(payrollId, companyId);
    if (!record) throw new ResourceNotFoundError('Payroll record not found');

    if (role === 'EMPLOYEE') {
      const user = await this.userRepository.findById(userId, companyId);
      if (!user) throw new ResourceNotFoundError('User not found');
      const employeeId = resolveActingEmployeeId(user);
      if (record.employeeId !== employeeId) {
        throw new ForbiddenError('You do not have access to this payroll record.');
      }
    }

    return toResponse(record);
  }
}
