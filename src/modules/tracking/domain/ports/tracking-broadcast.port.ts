export type TrackingBroadcastEventType =
  | 'location:updated'
  | 'tracking:started'
  | 'tracking:stopped'
  | 'employee:online'
  | 'employee:offline';

export interface TrackingLocationBroadcast {
  employeeId: string;
  tripId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  batteryLevel: number | null;
  lastSeenAt: string;
  trackingStatus: 'ONLINE' | 'OFFLINE';
}

export interface TrackingBroadcastPayload {
  companyId: string;
  tripId?: string;
  employeeIds?: string[];
  location?: TrackingLocationBroadcast;
  tripNumber?: string;
  reason?: string;
  lastSeenAt?: string;
}

export interface TrackingBroadcastPort {
  publish(eventType: TrackingBroadcastEventType, payload: TrackingBroadcastPayload): void;
}
