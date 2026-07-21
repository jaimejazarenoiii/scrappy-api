export interface UpsertLocationRequestDto {
  latitude: number;
  longitude: number;
  capturedAt: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
  batteryLevel?: number;
  isMockLocation?: boolean;
}

export interface CurrentLocationSummaryDto {
  employeeId: string;
  tripId: string | null;
  tripNumber: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  batteryLevel: number | null;
  trackingStatus: 'ONLINE' | 'OFFLINE';
  lastSeenAt: string | null;
}

export interface TrackingStatusResponseDto {
  employeeId: string;
  tripId: string | null;
  trackingStatus: 'ONLINE' | 'OFFLINE';
  lastSeenAt: string | null;
}

export interface TripTrackingEmployeeDto {
  employeeId: string;
  firstName: string;
  lastName: string;
  role: string | null;
  location: CurrentLocationSummaryDto;
}

export interface TripTrackingLocationsResponseDto {
  tripId: string;
  tripNumber: string;
  tripStatus: string;
  trackingActive: boolean;
  employees: TripTrackingEmployeeDto[];
}

export interface ActiveTripTrackingSummaryDto {
  tripId: string;
  tripNumber: string;
  tripStatus: string;
  origin: string;
  destination: string;
  employees: CurrentLocationSummaryDto[];
}

export interface ListActiveTripLocationsQueryDto {
  page: number;
  limit: number;
  tripId?: string;
  employeeId?: string;
}
