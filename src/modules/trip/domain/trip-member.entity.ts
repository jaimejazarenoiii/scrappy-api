import type { TripMemberRole } from './trip-member-role.js';

export interface TripMemberProps {
  id: string;
  tripId: string;
  employeeId: string;
  role: TripMemberRole;
  createdAt: Date;
  updatedAt: Date;
}

export class TripMemberEntity {
  private constructor(private readonly props: TripMemberProps) {}

  static create(props: TripMemberProps): TripMemberEntity {
    return new TripMemberEntity(props);
  }

  get id(): string {
    return this.props.id;
  }

  get tripId(): string {
    return this.props.tripId;
  }

  get employeeId(): string {
    return this.props.employeeId;
  }

  get role(): TripMemberRole {
    return this.props.role;
  }

  toPrimitives(): TripMemberProps {
    return { ...this.props };
  }
}
