import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { TransactionRepository } from '../../domain/transaction.repository.js';
import { assertFinishable } from '../../domain/transaction-rules.js';
import { assertCanFinish } from '../policies/transaction-authorization.policy.js';
import {
  buildTransactionDetailResponse,
  type TransactionDetailResponseDto,
} from '../dto/transaction-detail.response.js';
import { resolveIsAssigned } from '../services/transaction-access.service.js';
import { logTransactionAudit } from '../services/transaction-audit.service.js';

export class FinishTransactionUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    transactionId: string,
    auth: AuthorizationContext,
  ): Promise<TransactionDetailResponseDto> {
    const detail = await this.transactionRepository.findDetailById(transactionId, auth.companyId);
    if (!detail) throw new ResourceNotFoundError('Transaction not found');

    const isAssigned = await resolveIsAssigned(
      { userRepository: this.userRepository, transactionRepository: this.transactionRepository },
      auth,
      transactionId,
    );
    assertCanFinish(auth, { isAssigned });

    const totalAmount =
      Math.round(detail.items.reduce((sum, item) => sum + item.toPrimitives().total, 0) * 100) /
      100;
    assertFinishable(detail.transaction, detail.items.length, totalAmount, auth.role);

    const updated = await this.transactionRepository.update(transactionId, auth.companyId, {
      status: 'READY_FOR_PAYMENT',
      submittedAt: new Date(),
      submittedByUserId: auth.userId,
      updatedByUserId: auth.userId,
    });

    logTransactionAudit({
      action: 'transaction.finished',
      companyId: auth.companyId,
      resourceType: 'transaction',
      resourceId: transactionId,
      actorUserId: auth.userId,
    });

    return buildTransactionDetailResponse(updated);
  }
}
