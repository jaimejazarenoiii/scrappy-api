import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import {
  LifecycleConflictError,
  ResourceNotFoundError,
} from '../../../../shared/errors/http-exceptions.js';
import type { TransactionRepository } from '../../domain/transaction.repository.js';
import {
  buildTransactionDetailResponse,
  type TransactionDetailResponseDto,
} from '../dto/transaction-detail.response.js';
import { logTransactionAudit } from '../services/transaction-audit.service.js';

export class ArchiveTransactionUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(
    transactionId: string,
    auth: AuthorizationContext,
  ): Promise<TransactionDetailResponseDto> {
    const existing = await this.transactionRepository.findByIdIncludingArchived(
      transactionId,
      auth.companyId,
    );
    if (!existing) throw new ResourceNotFoundError('Transaction not found');
    if (existing.isArchived()) {
      throw new LifecycleConflictError('Transaction is already archived.');
    }

    await this.transactionRepository.archive(transactionId, auth.companyId);

    logTransactionAudit({
      action: 'transaction.archived',
      companyId: auth.companyId,
      resourceType: 'transaction',
      resourceId: transactionId,
      actorUserId: auth.userId,
    });

    const detail = await this.transactionRepository.findDetailById(transactionId, auth.companyId, {
      includeArchived: true,
    });
    if (!detail) throw new ResourceNotFoundError('Transaction not found');
    return buildTransactionDetailResponse(detail);
  }
}
