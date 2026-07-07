import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import { computeItemTotal } from '../../../../shared/transactions/item-total.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { TransactionRepository } from '../../domain/transaction.repository.js';
import type {
  TransactionItemRepository,
  UpdateTransactionItemInput,
} from '../../domain/transaction-item.repository.js';
import { assertDraftEditable, assertItemTotal } from '../../domain/transaction-rules.js';
import { assertCanManageDraft } from '../policies/transaction-authorization.policy.js';
import {
  buildTransactionItemResponse,
  type TransactionItemResponseDto,
} from '../dto/transaction-item.response.js';
import type { UpdateTransactionItemRequestDto } from '../dto/transaction-item.request.js';
import { resolveIsAssigned } from '../services/transaction-access.service.js';
import { logTransactionAudit } from '../services/transaction-audit.service.js';

export class UpdateTransactionItemUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly itemRepository: TransactionItemRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    transactionId: string,
    itemId: string,
    auth: AuthorizationContext,
    input: UpdateTransactionItemRequestDto,
  ): Promise<TransactionItemResponseDto> {
    const transaction = await this.transactionRepository.findById(transactionId, auth.companyId);
    if (!transaction) throw new ResourceNotFoundError('Transaction not found');
    assertDraftEditable(transaction);

    const isAssigned = await resolveIsAssigned(
      { userRepository: this.userRepository, transactionRepository: this.transactionRepository },
      auth,
      transactionId,
    );
    assertCanManageDraft(auth, { isAssigned });

    const existing = await this.itemRepository.findById(itemId, transactionId);
    if (!existing) throw new ResourceNotFoundError('Transaction item not found');
    const current = existing.toPrimitives();

    const update: UpdateTransactionItemInput = {
      materialName: input.materialName,
      unit: input.unit,
      notes: input.notes,
    };

    const recomputeTotal =
      input.weight !== undefined || input.price !== undefined || input.total !== undefined;
    if (recomputeTotal) {
      const weight = input.weight ?? current.weight;
      const price = input.price ?? current.price;
      assertItemTotal(weight, price, input.total);
      if (input.weight !== undefined) update.weight = input.weight;
      if (input.price !== undefined) update.price = input.price;
      update.total = computeItemTotal(weight, price);
    }

    const item = await this.itemRepository.update(itemId, transactionId, update);

    logTransactionAudit({
      action: 'transaction.item_updated',
      companyId: auth.companyId,
      resourceType: 'transaction_item',
      resourceId: itemId,
      actorUserId: auth.userId,
      metadata: { transactionId },
    });

    return buildTransactionItemResponse(item);
  }
}
