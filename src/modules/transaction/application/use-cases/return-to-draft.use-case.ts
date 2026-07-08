import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { TransactionRepository } from '../../domain/transaction.repository.js';
import { assertStatusTransition } from '../../domain/transaction-rules.js';
import { assertCanReturnToDraft } from '../policies/transaction-authorization.policy.js';
import {
  buildTransactionDetailResponse,
  type TransactionDetailResponseDto,
} from '../dto/transaction-detail.response.js';
import { logTransactionAudit } from '../services/transaction-audit.service.js';

export interface ReturnToDraftRequestDto {
  reason?: string;
}

export class ReturnToDraftUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(
    transactionId: string,
    auth: AuthorizationContext,
    input: ReturnToDraftRequestDto,
  ): Promise<TransactionDetailResponseDto> {
    const existing = await this.transactionRepository.findById(transactionId, auth.companyId);
    if (!existing) throw new ResourceNotFoundError('Transaction not found');

    assertCanReturnToDraft(auth);
    assertStatusTransition(existing, 'return_to_draft', auth.role);

    const detail = await this.transactionRepository.update(transactionId, auth.companyId, {
      status: 'DRAFT',
      updatedByUserId: auth.userId,
    });

    logTransactionAudit({
      action: 'transaction.returned_to_draft',
      companyId: auth.companyId,
      resourceType: 'transaction',
      resourceId: transactionId,
      actorUserId: auth.userId,
      metadata: input.reason ? { reason: input.reason } : undefined,
    });

    return buildTransactionDetailResponse(detail);
  }
}
