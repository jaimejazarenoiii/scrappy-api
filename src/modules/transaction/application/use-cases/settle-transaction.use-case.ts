import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { TransactionRepository } from '../../domain/transaction.repository.js';
import { assertReadyForPayment } from '../../domain/transaction-rules.js';
import { assertCanSettle } from '../policies/transaction-authorization.policy.js';
import {
  buildTransactionDetailResponse,
  type TransactionDetailResponseDto,
} from '../dto/transaction-detail.response.js';
import { logTransactionAudit } from '../services/transaction-audit.service.js';

export interface SettleTransactionRequestDto {
  settlementNote?: string;
}

export class SettleTransactionUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(
    transactionId: string,
    auth: AuthorizationContext,
    input: SettleTransactionRequestDto,
  ): Promise<TransactionDetailResponseDto> {
    const existing = await this.transactionRepository.findById(transactionId, auth.companyId);
    if (!existing) throw new ResourceNotFoundError('Transaction not found');

    assertCanSettle(auth);
    assertReadyForPayment(existing, auth.role);

    const detail = await this.transactionRepository.update(transactionId, auth.companyId, {
      status: 'PAID',
      paidAt: new Date(),
      paidByUserId: auth.userId,
      updatedByUserId: auth.userId,
    });

    logTransactionAudit({
      action: 'transaction.settled',
      companyId: auth.companyId,
      resourceType: 'transaction',
      resourceId: transactionId,
      actorUserId: auth.userId,
      metadata: input.settlementNote ? { settlementNote: input.settlementNote } : undefined,
    });

    return buildTransactionDetailResponse(detail);
  }
}
