import type { TripLoadItemEntity } from './trip-load-item.entity.js';

export interface TripLoadProps {
  id: string;
  tripId: string;
  notes: string | null;
  createdByUserId: string;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: TripLoadItemEntity[];
}

export class TripLoadEntity {
  private constructor(private readonly props: TripLoadProps) {}

  static create(props: TripLoadProps): TripLoadEntity {
    return new TripLoadEntity(props);
  }

  get id(): string {
    return this.props.id;
  }
  get tripId(): string {
    return this.props.tripId;
  }
  get notes(): string | null {
    return this.props.notes;
  }
  get createdByUserId(): string {
    return this.props.createdByUserId;
  }
  get updatedByUserId(): string | null {
    return this.props.updatedByUserId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get items(): TripLoadItemEntity[] {
    return this.props.items;
  }

  toPrimitives(): Omit<TripLoadProps, 'items'> & {
    items: ReturnType<TripLoadItemEntity['toPrimitives']>[];
  } {
    return {
      id: this.props.id,
      tripId: this.props.tripId,
      notes: this.props.notes,
      createdByUserId: this.props.createdByUserId,
      updatedByUserId: this.props.updatedByUserId,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      items: this.props.items.map((item) => item.toPrimitives()),
    };
  }
}
