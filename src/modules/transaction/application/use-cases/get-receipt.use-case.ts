import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import {
  LifecycleConflictError,
  ResourceNotFoundError,
} from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { TransactionRepository } from '../../domain/transaction.repository.js';
import { assertCanViewTransaction } from '../policies/transaction-authorization.policy.js';
import type { ReceiptResponseDto } from '../dto/receipt.response.js';
import type { ReceiptAssemblerService } from '../services/receipt-assembler.service.js';
import { resolveActingEmployeeIdForUser } from '../services/transaction-access.service.js';

export class GetReceiptUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly userRepository: UserRepository,
    private readonly receiptAssemblerService: ReceiptAssemblerService,
  ) {}

  async execute(transactionId: string, auth: AuthorizationContext): Promise<ReceiptResponseDto> {
    const detail = await this.transactionRepository.findDetailById(transactionId, auth.companyId, {
      includeArchived: true,
    });
    if (!detail) throw new ResourceNotFoundError('Transaction not found');

    let isAssigned = true;
    if (auth.role === 'EMPLOYEE') {
      const employeeId = await resolveActingEmployeeIdForUser(
        this.userRepository,
        auth.companyId,
        auth.userId,
      );
      isAssigned = detail.assignments.some((assignment) => assignment.employeeId === employeeId);
    }
    assertCanViewTransaction(auth, { isAssigned });

    if (!detail.transaction.isPaid()) {
      throw new LifecycleConflictError('Receipt is only available after settlement.');
    }

    return this.receiptAssemblerService.build(detail);
  }
}
