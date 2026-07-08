import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { TransactionRepository } from '../../domain/transaction.repository.js';
import type { TransactionAttachmentRepository } from '../../domain/transaction-attachment.repository.js';
import type { FileStorage } from '../../infrastructure/file-storage/file-storage.interface.js';
import { assertCanViewTransaction } from '../policies/transaction-authorization.policy.js';
import { resolveActingEmployeeIdForUser } from '../services/transaction-access.service.js';

export interface TransactionAttachmentContentDto {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}

export class GetTransactionAttachmentContentUseCase {
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
  ): Promise<TransactionAttachmentContentDto> {
    const detail = await this.transactionRepository.findDetailById(transactionId, auth.companyId, {
      includeArchived: true,
    });
    if (!detail) throw new ResourceNotFoundError('Transaction not found');

    let isAssigned = true;
    if (auth.role === 'EMPLOYEE') {
      const employeeId = await resolveActingEmployeeIdForUser(
        this.userRepository,
        auth.companyId,
        auth.userId,
      );
      isAssigned = detail.assignments.some((assignment) => assignment.employeeId === employeeId);
    }
    assertCanViewTransaction(auth, { isAssigned });

    const attachment = await this.attachmentRepository.findById(attachmentId, transactionId);
    if (!attachment) throw new ResourceNotFoundError('Attachment not found');

    const buffer = await this.fileStorage.read(attachment.filePath);
    const props = attachment.toPrimitives();

    return {
      buffer,
      mimeType: props.mimeType,
      fileName: props.fileName,
    };
  }
}
