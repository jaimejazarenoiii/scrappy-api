import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { TransactionRepository } from '../../domain/transaction.repository.js';
import type { TransactionItemRepository } from '../../domain/transaction-item.repository.js';
import { assertDraftEditable } from '../../domain/transaction-rules.js';
import { assertCanManageDraft } from '../policies/transaction-authorization.policy.js';
import { resolveIsAssigned } from '../services/transaction-access.service.js';
import { logTransactionAudit } from '../services/transaction-audit.service.js';

export class RemoveTransactionItemUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly itemRepository: TransactionItemRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(transactionId: string, itemId: string, auth: AuthorizationContext): Promise<void> {
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

    await this.itemRepository.delete(itemId, transactionId);

    logTransactionAudit({
      action: 'transaction.item_removed',
      companyId: auth.companyId,
      resourceType: 'transaction_item',
      resourceId: itemId,
      actorUserId: auth.userId,
      metadata: { transactionId },
    });
  }
}
