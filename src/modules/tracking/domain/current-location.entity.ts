import { deriveTrackingStatus, type TrackingStatus } from './tracking-status.js';

export interface CurrentLocationProps {
  id: string;
  companyId: string;
  employeeId: string;
  tripId: string | null;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  batteryLevel: number | null;
  isMockLocation: boolean;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class CurrentLocationEntity {
  private constructor(private readonly props: CurrentLocationProps) {}

  static create(props: CurrentLocationProps): CurrentLocationEntity {
    return new CurrentLocationEntity(props);
  }

  toPrimitives(): CurrentLocationProps {
    return { ...this.props };
  }

  isOnline(stalenessMs: number, now: Date = new Date()): boolean {
    return (
      deriveTrackingStatus(this.props.lastSeenAt, this.props.tripId, stalenessMs, now) === 'ONLINE'
    );
  }

  trackingStatus(stalenessMs: number, now: Date = new Date()): TrackingStatus {
    return deriveTrackingStatus(this.props.lastSeenAt, this.props.tripId, stalenessMs, now);
  }

  assertNewerThan(capturedAt: Date): void {
    if (capturedAt.getTime() < this.props.lastSeenAt.getTime()) {
      throw new Error('STALE_LOCATION');
    }
  }

  clearTripAssociation(): CurrentLocationEntity {
    return CurrentLocationEntity.create({ ...this.props, tripId: null });
  }
}
