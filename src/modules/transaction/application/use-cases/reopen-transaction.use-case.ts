import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { TransactionRepository } from '../../domain/transaction.repository.js';
import { assertPaid } from '../../domain/transaction-rules.js';
import { assertCanReopen } from '../policies/transaction-authorization.policy.js';
import {
  buildTransactionDetailResponse,
  type TransactionDetailResponseDto,
} from '../dto/transaction-detail.response.js';
import { logTransactionAudit } from '../services/transaction-audit.service.js';

export interface ReopenTransactionRequestDto {
  reason: string;
}

export class ReopenTransactionUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(
    transactionId: string,
    auth: AuthorizationContext,
    input: ReopenTransactionRequestDto,
  ): Promise<TransactionDetailResponseDto> {
    const existing = await this.transactionRepository.findById(transactionId, auth.companyId);
    if (!existing) throw new ResourceNotFoundError('Transaction not found');

    assertCanReopen(auth);
    assertPaid(existing, auth.role);

    const detail = await this.transactionRepository.update(transactionId, auth.companyId, {
      status: 'READY_FOR_PAYMENT',
      paidAt: null,
      paidByUserId: null,
      reopenedAt: new Date(),
      reopenedByUserId: auth.userId,
      reopenReason: input.reason,
      updatedByUserId: auth.userId,
    });

    logTransactionAudit({
      action: 'transaction.reopened',
      companyId: auth.companyId,
      resourceType: 'transaction',
      resourceId: transactionId,
      actorUserId: auth.userId,
      metadata: { reason: input.reason },
    });

    return buildTransactionDetailResponse(detail);
  }
}
