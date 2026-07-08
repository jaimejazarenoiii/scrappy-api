import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { TransactionRepository } from '../../domain/transaction.repository.js';
import type { TransactionAttachmentRepository } from '../../domain/transaction-attachment.repository.js';
import { assertEditable } from '../../domain/transaction-rules.js';
import type { FileStorage } from '../../infrastructure/file-storage/file-storage.interface.js';
import { assertCanEditTransaction } from '../policies/transaction-authorization.policy.js';
import { resolveIsAssigned } from '../services/transaction-access.service.js';
import { logTransactionAudit } from '../services/transaction-audit.service.js';

export class RemoveTransactionAttachmentUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly attachmentRepository: TransactionAttachmentRepository,
    private readonly fileStorage: FileStorage,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    transactionId: string,
    attachmentId: string,
    auth: AuthorizationContext,
  ): Promise<void> {
    const transaction = await this.transactionRepository.findById(transactionId, auth.companyId);
    if (!transaction) throw new ResourceNotFoundError('Transaction not found');

    const isAssigned = await resolveIsAssigned(
      { userRepository: this.userRepository, transactionRepository: this.transactionRepository },
      auth,
      transactionId,
    );
    assertCanEditTransaction(auth, { isAssigned });
    assertEditable(transaction, auth.role, isAssigned);

    const attachment = await this.attachmentRepository.findById(attachmentId, transactionId);
    if (!attachment) throw new ResourceNotFoundError('Transaction attachment not found');

    await this.attachmentRepository.delete(attachmentId, transactionId);
    await this.fileStorage.delete(attachment.filePath);

    logTransactionAudit({
      action: 'transaction.attachment_removed',
      companyId: auth.companyId,
      resourceType: 'transaction_attachment',
      resourceId: attachmentId,
      actorUserId: auth.userId,
      metadata: { transactionId },
    });
  }
}
