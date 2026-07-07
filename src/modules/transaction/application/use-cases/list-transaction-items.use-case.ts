import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { TransactionRepository } from '../../domain/transaction.repository.js';
import type { TransactionItemRepository } from '../../domain/transaction-item.repository.js';
import { assertCanViewTransaction } from '../policies/transaction-authorization.policy.js';
import {
  buildTransactionItemResponse,
  type TransactionItemResponseDto,
} from '../dto/transaction-item.response.js';
import { resolveActingEmployeeIdForUser } from '../services/transaction-access.service.js';

export class ListTransactionItemsUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly itemRepository: TransactionItemRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    transactionId: string,
    auth: AuthorizationContext,
  ): Promise<TransactionItemResponseDto[]> {
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

    const items = await this.itemRepository.listByTransaction(transactionId);
    return items.map(buildTransactionItemResponse);
  }
}
