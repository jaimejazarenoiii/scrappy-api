import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import {
  ForbiddenError,
  ResourceNotFoundError,
} from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { TransactionRepository } from '../../domain/transaction.repository.js';
import { assertStatusTransition } from '../../domain/transaction-rules.js';
import {
  buildTransactionDetailResponse,
  type TransactionDetailResponseDto,
} from '../dto/transaction-detail.response.js';
import type { CancelTransactionRequestDto } from '../dto/cancel-transaction.request.js';
import { resolveIsAssigned } from '../services/transaction-access.service.js';
import { logTransactionAudit } from '../services/transaction-audit.service.js';

export class CancelTransactionUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    transactionId: string,
    auth: AuthorizationContext,
    input: CancelTransactionRequestDto,
  ): Promise<TransactionDetailResponseDto> {
    const existing = await this.transactionRepository.findById(transactionId, auth.companyId);
    if (!existing) throw new ResourceNotFoundError('Transaction not found');

    const isAssigned = await resolveIsAssigned(
      { userRepository: this.userRepository, transactionRepository: this.transactionRepository },
      auth,
      transactionId,
    );
    if (auth.role === 'EMPLOYEE') {
      if (!isAssigned) {
        throw new ForbiddenError('You are not assigned to this transaction.');
      }
      if (!existing.isDraft()) {
        throw new ForbiddenError('Employees can only cancel draft transactions.');
      }
    }
    assertStatusTransition(existing, 'cancel', auth.role);

    await this.transactionRepository.cancel(transactionId, auth.companyId, {
      cancellationReason: input.cancellationReason ?? null,
      updatedByUserId: auth.userId,
      cancelledByUserId: auth.userId,
    });

    logTransactionAudit({
      action: 'transaction.cancelled',
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
