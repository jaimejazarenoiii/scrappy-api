import type { TransactionAttachmentType } from './transaction-attachment-type.js';

export interface TransactionAttachmentProps {
  id: string;
  transactionId: string;
  attachmentType: TransactionAttachmentType;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  uploadedByUserId: string;
  createdAt: Date;
}

export class TransactionAttachmentEntity {
  private constructor(private readonly props: TransactionAttachmentProps) {}

  static create(props: TransactionAttachmentProps): TransactionAttachmentEntity {
    return new TransactionAttachmentEntity(props);
  }

  get id(): string {
    return this.props.id;
  }
  get transactionId(): string {
    return this.props.transactionId;
  }
  get filePath(): string {
    return this.props.filePath;
  }

  toPrimitives(): TransactionAttachmentProps {
    return { ...this.props };
  }
}
