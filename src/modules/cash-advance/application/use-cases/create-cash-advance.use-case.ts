import { randomUUID } from 'node:crypto';
import { CashAdvanceEntity } from '../../domain/cash-advance.entity.js';
import {
  assertEmployeeBelongsToCompany,
  assertEmployeeEligibleForAdvance,
  assertPositiveAdvanceAmount,
} from '../../domain/cash-advance-rules.js';
import type { CashAdvanceRepository } from '../../domain/cash-advance.repository.js';
import type { EmployeeRepository } from '../../../employee/domain/employee.repository.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { CreateCashAdvanceRequestDto } from '../dto/create-cash-advance.request.js';
import type { CashAdvanceResponseDto } from '../dto/cash-advance.response.js';
import { logCashAdvanceAudit } from '../services/cash-advance-audit.service.js';

function toResponse(advance: CashAdvanceEntity): CashAdvanceResponseDto {
  const { createdByUserId: _, ...rest } = advance.toPrimitives();
  return rest;
}

export class CreateCashAdvanceUseCase {
  constructor(
    private readonly cashAdvanceRepository: CashAdvanceRepository,
    private readonly employeeRepository: EmployeeRepository,
  ) {}

  async execute(
    companyId: string,
    userId: string,
    input: CreateCashAdvanceRequestDto,
  ): Promise<CashAdvanceResponseDto> {
    assertPositiveAdvanceAmount(input.amount);

    const employee = await this.employeeRepository.findById(input.employeeId, companyId);
    if (!employee) throw new ResourceNotFoundError('Employee not found');

    assertEmployeeBelongsToCompany(employee, companyId);
    assertEmployeeEligibleForAdvance(employee);

    const advance = CashAdvanceEntity.createNew({
      id: randomUUID(),
      companyId,
      employeeId: input.employeeId,
      amount: input.amount,
      reason: input.reason ?? null,
      issuedAt: input.issuedAt,
      createdByUserId: userId,
    });

    const created = await this.cashAdvanceRepository.create({
      id: advance.id,
      companyId: advance.companyId,
      employeeId: advance.employeeId,
      amount: advance.amount,
      reason: advance.toPrimitives().reason,
      issuedAt: advance.issuedAt,
      createdByUserId: userId,
    });

    logCashAdvanceAudit({
      action: 'cash_advance.created',
      companyId,
      resourceType: 'cash_advance',
      resourceId: created.id,
      actorUserId: userId,
      metadata: {
        employeeId: input.employeeId,
        amount: input.amount,
        issuedAt: advance.issuedAt.toISOString(),
      },
    });

    return toResponse(created);
  }
}
