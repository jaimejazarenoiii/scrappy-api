import { randomUUID } from 'node:crypto';
import { validatePayPeriod } from '../../../../shared/workforce/pay-period.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { EmployeeRepository } from '../../../employee/domain/employee.repository.js';
import type { CashAdvanceRepository } from '../../../cash-advance/domain/cash-advance.repository.js';
import type { PayrollRecordRepository } from '../../domain/payroll-record.repository.js';
import { PayrollRecordEntity } from '../../domain/payroll-record.entity.js';
import {
  assertEmployeeHasWeeklySalary,
  assertNoDuplicatePayPeriod,
  assertNonNegativeNetPay,
} from '../../domain/payroll-rules.js';
import { calculateFifoDeductions } from '../services/payroll-deduction.service.js';
import { logPayrollAudit } from '../services/payroll-audit.service.js';
import type { GeneratePayrollRequestDto } from '../dto/generate-payroll.request.js';
import type { GeneratePayrollResponseDto, PayrollResponseDto } from '../dto/payroll.response.js';

function toResponse(record: PayrollRecordEntity): PayrollResponseDto {
  const { createdByUserId: _, updatedByUserId: __, ...rest } = record.toPrimitives();
  return rest;
}

export class GenerateWeeklyPayrollUseCase {
  constructor(
    private readonly payrollRepository: PayrollRecordRepository,
    private readonly employeeRepository: EmployeeRepository,
    private readonly cashAdvanceRepository: CashAdvanceRepository,
  ) {}

  async execute(
    companyId: string,
    userId: string,
    input: GeneratePayrollRequestDto,
  ): Promise<GeneratePayrollResponseDto> {
    validatePayPeriod(input.payPeriodStart, input.payPeriodEnd);

    const employees = input.employeeIds?.length
      ? await this.resolveEmployees(companyId, input.employeeIds)
      : await this.employeeRepository.listActiveByCompany(companyId);

    const prepared = [];
    for (const employee of employees) {
      assertEmployeeHasWeeklySalary(employee);

      const existing = await this.payrollRepository.findByEmployeeAndPayPeriod(
        employee.id,
        companyId,
        input.payPeriodStart,
      );
      assertNoDuplicatePayPeriod(existing);

      const outstandingAdvances = await this.cashAdvanceRepository.listOutstandingByEmployee(
        employee.id,
        companyId,
      );
      const deduction = calculateFifoDeductions(employee.weeklySalary, outstandingAdvances);
      assertNonNegativeNetPay(
        deduction.netPay,
        employee.id,
        deduction.grossSalary,
        deduction.totalDeductions,
      );

      prepared.push({ employee, deduction });
    }

    const items: PayrollResponseDto[] = [];
    for (const { employee, deduction } of prepared) {
      const payroll = PayrollRecordEntity.createNew({
        id: randomUUID(),
        companyId,
        employeeId: employee.id,
        payPeriodStart: input.payPeriodStart,
        payPeriodEnd: input.payPeriodEnd,
        grossSalary: deduction.grossSalary,
        cashAdvanceDeductions: deduction.totalDeductions,
        netPay: deduction.netPay,
        createdByUserId: userId,
      });

      const created = await this.payrollRepository.create({
        id: payroll.id,
        companyId: payroll.companyId,
        employeeId: payroll.employeeId,
        payPeriodStart: payroll.payPeriodStart,
        payPeriodEnd: payroll.payPeriodEnd,
        grossSalary: payroll.grossSalary,
        cashAdvanceDeductions: payroll.cashAdvanceDeductions,
        netPay: payroll.netPay,
        createdByUserId: userId,
      });

      logPayrollAudit({
        action: 'payroll.generated',
        companyId,
        resourceType: 'payroll_record',
        resourceId: created.id,
        actorUserId: userId,
        metadata: {
          employeeId: employee.id,
          payPeriodStart: input.payPeriodStart,
          payPeriodEnd: input.payPeriodEnd,
          grossSalary: deduction.grossSalary,
          cashAdvanceDeductions: deduction.totalDeductions,
          netPay: deduction.netPay,
        },
      });

      items.push(toResponse(created));
    }

    return {
      payPeriodStart: input.payPeriodStart,
      payPeriodEnd: input.payPeriodEnd,
      items,
    };
  }

  private async resolveEmployees(companyId: string, employeeIds: string[]) {
    const employees = [];
    for (const employeeId of employeeIds) {
      const employee = await this.employeeRepository.findById(employeeId, companyId);
      if (!employee) throw new ResourceNotFoundError('Employee not found');
      employees.push(employee);
    }
    return employees;
  }
}
