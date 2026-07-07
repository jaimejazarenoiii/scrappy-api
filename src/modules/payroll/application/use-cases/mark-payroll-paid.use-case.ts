import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { CashAdvanceRepository } from '../../../cash-advance/domain/cash-advance.repository.js';
import type { PayrollRecordRepository } from '../../domain/payroll-record.repository.js';
import { assertPayrollIsPayable } from '../../domain/payroll-rules.js';
import { allocateFifoDeductions } from '../services/payroll-deduction.service.js';
import { logPayrollAudit } from '../services/payroll-audit.service.js';
import type { MarkPayrollPaidRequestDto } from '../dto/mark-payroll-paid.request.js';
import type { PayrollRecordEntity } from '../../domain/payroll-record.entity.js';
import type { PayrollResponseDto } from '../dto/payroll.response.js';

function toResponse(record: PayrollRecordEntity): PayrollResponseDto {
  const { createdByUserId: _, updatedByUserId: __, ...rest } = record.toPrimitives();
  return rest;
}

export class MarkPayrollPaidUseCase {
  constructor(
    private readonly payrollRepository: PayrollRecordRepository,
    private readonly cashAdvanceRepository: CashAdvanceRepository,
  ) {}

  async execute(
    payrollId: string,
    companyId: string,
    userId: string,
    input: MarkPayrollPaidRequestDto = {},
  ): Promise<PayrollResponseDto> {
    const record = await this.payrollRepository.findById(payrollId, companyId);
    if (!record) throw new ResourceNotFoundError('Payroll record not found');
    assertPayrollIsPayable(record);

    if (record.cashAdvanceDeductions > 0) {
      const outstandingAdvances = await this.cashAdvanceRepository.listOutstandingByEmployee(
        record.employeeId,
        companyId,
      );
      const allocations = allocateFifoDeductions(record.cashAdvanceDeductions, outstandingAdvances);

      for (const allocation of allocations) {
        await this.cashAdvanceRepository.applyDeduction(
          allocation.cashAdvanceId,
          companyId,
          allocation.amount,
        );
      }
    }

    const updated = await this.payrollRepository.markPaid(payrollId, companyId, {
      paymentReference: input.paymentReference ?? null,
      updatedByUserId: userId,
    });

    logPayrollAudit({
      action: 'payroll.mark_paid',
      companyId,
      resourceType: 'payroll_record',
      resourceId: updated.id,
      actorUserId: userId,
      metadata: {
        employeeId: updated.employeeId,
        cashAdvanceDeductions: updated.cashAdvanceDeductions,
        paymentReference: input.paymentReference ?? null,
      },
    });

    return toResponse(updated);
  }
}
