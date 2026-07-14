import type { TransactionItemUnit } from '../../transaction/domain/transaction-item-unit.js';

export interface TripLoadItemProps {
  id: string;
  tripLoadId: string;
  materialName: string;
  materialNameNorm: string;
  quantity: number;
  unit: TransactionItemUnit;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class TripLoadItemEntity {
  private constructor(private readonly props: TripLoadItemProps) {}

  static create(props: TripLoadItemProps): TripLoadItemEntity {
    return new TripLoadItemEntity(props);
  }

  get id(): string {
    return this.props.id;
  }
  get tripLoadId(): string {
    return this.props.tripLoadId;
  }
  get materialName(): string {
    return this.props.materialName;
  }
  get materialNameNorm(): string {
    return this.props.materialNameNorm;
  }
  get quantity(): number {
    return this.props.quantity;
  }
  get unit(): TransactionItemUnit {
    return this.props.unit;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toPrimitives(): TripLoadItemProps {
    return { ...this.props };
  }
}
