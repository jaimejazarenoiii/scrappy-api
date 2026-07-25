export interface AppendLocationHistoryInput {
  id: string;
  companyId: string;
  employeeId: string;
  tripId: string;
  latitude: number;
  longitude: number;
  capturedAt: Date;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  batteryLevel: number | null;
}

export interface RoutePointRecord {
  latitude: number;
  longitude: number;
  capturedAt: Date;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  batteryLevel: number | null;
}

export interface FindRoutePointsQuery {
  tripId: string;
  companyId: string;
  employeeId: string;
  page: number;
  limit: number;
  sortOrder: 'asc' | 'desc';
}

export interface FindRoutePointsResult {
  points: RoutePointRecord[];
  total: number;
}

export interface LocationHistoryRepository {
  append(input: AppendLocationHistoryInput): Promise<void>;
  findLatestCapturedAt(employeeId: string, tripId: string, companyId: string): Promise<Date | null>;
  findRoutePoints(query: FindRoutePointsQuery): Promise<FindRoutePointsResult>;
  deleteByTripIds(tripIds: string[]): Promise<number>;
  findTripIdsEligibleForRetention(cutoffDate: Date): Promise<string[]>;
}
