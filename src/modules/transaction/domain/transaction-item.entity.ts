import type { TransactionItemUnit } from './transaction-item-unit.js';

export interface TransactionItemProps {
  id: string;
  transactionId: string;
  materialName: string;
  weight: number;
  unit: TransactionItemUnit;
  price: number;
  total: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class TransactionItemEntity {
  private constructor(private readonly props: TransactionItemProps) {}

  static create(props: TransactionItemProps): TransactionItemEntity {
    return new TransactionItemEntity(props);
  }

  get id(): string {
    return this.props.id;
  }
  get transactionId(): string {
    return this.props.transactionId;
  }
  get materialName(): string {
    return this.props.materialName;
  }
  get total(): number {
    return this.props.total;
  }

  toPrimitives(): TransactionItemProps {
    return { ...this.props };
  }
}
