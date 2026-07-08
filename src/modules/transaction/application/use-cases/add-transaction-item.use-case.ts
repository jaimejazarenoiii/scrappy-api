import { randomUUID } from 'node:crypto';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import { computeItemTotal } from '../../../../shared/transactions/item-total.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { TransactionRepository } from '../../domain/transaction.repository.js';
import type { TransactionItemRepository } from '../../domain/transaction-item.repository.js';
import { assertEditable, assertItemTotal } from '../../domain/transaction-rules.js';
import { assertCanEditTransaction } from '../policies/transaction-authorization.policy.js';
import {
  buildTransactionItemResponse,
  type TransactionItemResponseDto,
} from '../dto/transaction-item.response.js';
import type { AddTransactionItemRequestDto } from '../dto/transaction-item.request.js';
import { resolveIsAssigned } from '../services/transaction-access.service.js';
import { logTransactionAudit } from '../services/transaction-audit.service.js';

export class AddTransactionItemUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly itemRepository: TransactionItemRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    transactionId: string,
    auth: AuthorizationContext,
    input: AddTransactionItemRequestDto,
  ): Promise<TransactionItemResponseDto> {
    const transaction = await this.transactionRepository.findById(transactionId, auth.companyId);
    if (!transaction) throw new ResourceNotFoundError('Transaction not found');

    const isAssigned = await resolveIsAssigned(
      { userRepository: this.userRepository, transactionRepository: this.transactionRepository },
      auth,
      transactionId,
    );
    assertCanEditTransaction(auth, { isAssigned });
    assertEditable(transaction, auth.role, isAssigned);

    assertItemTotal(input.weight, input.price, input.total);

    const item = await this.itemRepository.create({
      id: randomUUID(),
      transactionId,
      materialName: input.materialName,
      weight: input.weight,
      unit: input.unit,
      price: input.price,
      total: computeItemTotal(input.weight, input.price),
      notes: input.notes ?? null,
    });

    logTransactionAudit({
      action: 'transaction.item_added',
      companyId: auth.companyId,
      resourceType: 'transaction_item',
      resourceId: item.id,
      actorUserId: auth.userId,
      metadata: { transactionId },
    });

    return buildTransactionItemResponse(item);
  }
}
