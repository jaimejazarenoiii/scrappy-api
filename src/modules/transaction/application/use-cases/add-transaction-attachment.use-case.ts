import { randomUUID } from 'node:crypto';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import {
  BusinessRuleViolationError,
  ResourceNotFoundError,
  ValidationAppError,
} from '../../../../shared/errors/http-exceptions.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { TransactionRepository } from '../../domain/transaction.repository.js';
import type { TransactionAttachmentRepository } from '../../domain/transaction-attachment.repository.js';
import {
  ALLOWED_PHOTO_MIME_TYPES,
  MAX_PHOTO_SIZE_BYTES,
  MAX_TRANSACTION_PHOTOS,
} from '../../domain/attachment-constraints.js';
import { assertDraftEditable } from '../../domain/transaction-rules.js';
import type { FileStorage } from '../../infrastructure/file-storage/file-storage.interface.js';
import { assertCanManageDraft } from '../policies/transaction-authorization.policy.js';
import {
  buildTransactionAttachmentResponse,
  type TransactionAttachmentResponseDto,
} from '../dto/transaction-attachment.response.js';
import { resolveIsAssigned } from '../services/transaction-access.service.js';
import { logTransactionAudit } from '../services/transaction-audit.service.js';

export interface UploadedFileInput {
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export class AddTransactionAttachmentUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly attachmentRepository: TransactionAttachmentRepository,
    private readonly fileStorage: FileStorage,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    transactionId: string,
    auth: AuthorizationContext,
    file: UploadedFileInput | undefined,
  ): Promise<TransactionAttachmentResponseDto> {
    if (!file) {
      throw new ValidationAppError('A photo file is required.', [
        { path: 'file', message: 'Provide a photo in the multipart "file" field.' },
      ]);
    }
    if (!ALLOWED_PHOTO_MIME_TYPES.includes(file.mimeType)) {
      throw new ValidationAppError('Unsupported file type. Allowed types: JPEG, PNG, WEBP.');
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      throw new ValidationAppError('File exceeds the 5 MB size limit.');
    }

    const transaction = await this.transactionRepository.findById(transactionId, auth.companyId);
    if (!transaction) throw new ResourceNotFoundError('Transaction not found');
    assertDraftEditable(transaction);

    const isAssigned = await resolveIsAssigned(
      { userRepository: this.userRepository, transactionRepository: this.transactionRepository },
      auth,
      transactionId,
    );
    assertCanManageDraft(auth, { isAssigned });

    const existingCount = await this.attachmentRepository.countByTransaction(transactionId);
    if (existingCount >= MAX_TRANSACTION_PHOTOS) {
      throw new BusinessRuleViolationError(
        `A transaction can have at most ${MAX_TRANSACTION_PHOTOS} photos.`,
      );
    }

    const saved = await this.fileStorage.save({
      companyId: auth.companyId,
      transactionId,
      fileName: file.originalName,
      mimeType: file.mimeType,
      content: file.buffer,
    });

    const attachment = await this.attachmentRepository.create({
      id: randomUUID(),
      transactionId,
      attachmentType: 'PHOTO',
      fileName: file.originalName,
      filePath: saved.filePath,
      mimeType: file.mimeType,
      fileSize: saved.fileSize,
      uploadedByUserId: auth.userId,
    });

    logTransactionAudit({
      action: 'transaction.attachment_added',
      companyId: auth.companyId,
      resourceType: 'transaction_attachment',
      resourceId: attachment.id,
      actorUserId: auth.userId,
      metadata: { transactionId },
    });

    return buildTransactionAttachmentResponse(attachment);
  }
}
