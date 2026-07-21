import type { TripStatus } from '../../../trip/domain/trip-status.js';
import type { TrackingSessionState } from '../../domain/tracking-session-state.js';

export interface TrackingSessionTripDto {
  id: string;
  tripNumber: string;
  status: TripStatus;
  origin: string;
  destination: string;
  scheduledStart: string;
  actualStart: string | null;
}

export interface TrackingSessionResponseDto {
  sessionState: TrackingSessionState;
  canTrack: boolean;
  employeeId?: string;
  trip?: TrackingSessionTripDto;
  endedTrip?: TrackingSessionTripDto;
  synchronizedAt: string;
}

export interface GetTrackingSessionQueryDto {
  lastKnownTripId?: string;
}
