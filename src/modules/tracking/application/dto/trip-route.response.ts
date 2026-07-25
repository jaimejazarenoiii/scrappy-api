export interface RoutePointDto {
  latitude: number;
  longitude: number;
  capturedAt: string;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  batteryLevel: number | null;
}

export interface RouteEmployeeMetaDto {
  total: number;
  page: number;
  limit: number;
}

export interface RouteEmployeeEntryDto {
  employeeId: string;
  firstName: string;
  lastName: string;
  role: string | null;
  points: RoutePointDto[];
  meta: RouteEmployeeMetaDto;
}

export interface TripRouteResponseDto {
  tripId: string;
  tripNumber: string;
  tripStatus: string;
  employees: RouteEmployeeEntryDto[];
}

export interface GetTripRouteQueryDto {
  employeeId?: string;
  page: number;
  limit: number;
  sortOrder: 'asc' | 'desc';
}
