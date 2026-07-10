import { randomUUID } from 'node:crypto';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import { isOperationallyReadyForRole } from '../../../../shared/workforce/operational-readiness.js';
import type { AttendanceSessionRepository } from '../../../attendance/domain/attendance-session.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { ExpenseRepository } from '../../domain/expense.repository.js';
import { assertOperationallyReady, assertPositiveAmount } from '../../domain/expense-rules.js';
import type { CreateExpenseRequestDto } from '../dto/create-expense.request.js';
import {
  buildExpenseDetailResponse,
  type ExpenseDetailResponseDto,
} from '../dto/expense.response.js';
import { EXPENSE_AUDIT_ACTIONS, logExpenseAudit } from '../services/expense-audit.service.js';
import type { ExpenseContextValidationService } from '../services/expense-context-validation.service.js';
import type { ExpenseNumberService } from '../services/expense-number.service.js';
import { resolveActingEmployeeIdForUser } from '../../../transaction/application/services/transaction-access.service.js';

export class CreateExpenseUseCase {
  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly userRepository: UserRepository,
    private readonly attendanceRepository: AttendanceSessionRepository,
    private readonly expenseNumberService: ExpenseNumberService,
    private readonly contextValidationService: ExpenseContextValidationService,
  ) {}

  async execute(
    auth: AuthorizationContext,
    input: CreateExpenseRequestDto,
  ): Promise<ExpenseDetailResponseDto> {
    const actingUser = await this.userRepository.findById(auth.userId, auth.companyId);
    if (!actingUser) throw new ResourceNotFoundError('User not found');

    let actingEmployeeId: string | null = actingUser.employeeId;
    if (auth.role === 'EMPLOYEE') {
      actingEmployeeId = await resolveActingEmployeeIdForUser(
        this.userRepository,
        auth.companyId,
        auth.userId,
      );
      const openSession = await this.attendanceRepository.findOpenSession(
        actingEmployeeId,
        auth.companyId,
      );
      if (!isOperationallyReadyForRole(openSession, actingUser.role)) {
        assertOperationallyReady(openSession);
      }
    }

    assertPositiveAmount(input.amount);
    await this.contextValidationService.validateReferences(auth.companyId, input);
    const contextFks = this.contextValidationService.resolveContextForeignKeys(input);

    const expenseNumber = await this.expenseNumberService.allocate(
      auth.companyId,
      input.expenseDate,
    );
    const recordImmediately =
      (auth.role === 'OWNER' || auth.role === 'MANAGER') && input.recordImmediately === true;
    const now = new Date();

    const detail = await this.expenseRepository.create({
      id: randomUUID(),
      companyId: auth.companyId,
      expenseNumber,
      expenseDate: input.expenseDate,
      category: input.category,
      amount: input.amount,
      description: input.description,
      status: recordImmediately ? 'RECORDED' : 'DRAFT',
      contextType: input.contextType,
      ...contextFks,
      createdByUserId: auth.userId,
      createdByEmployeeId: actingEmployeeId,
      updatedByUserId: auth.userId,
      recordedByUserId: recordImmediately ? auth.userId : null,
      recordedAt: recordImmediately ? now : null,
    });

    logExpenseAudit({
      action: EXPENSE_AUDIT_ACTIONS.CREATED,
      companyId: auth.companyId,
      resourceType: 'expense',
      resourceId: detail.expense.id,
      actorUserId: auth.userId,
      metadata: { expenseNumber, status: detail.expense.status },
    });

    return buildExpenseDetailResponse(detail);
  }
}
