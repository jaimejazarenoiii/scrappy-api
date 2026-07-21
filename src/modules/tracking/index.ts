import type { CompanyRepository } from '../company/domain/company.repository.js';
import type { EmployeeRepository } from '../employee/domain/employee.repository.js';
import type { TripRepository } from '../trip/domain/trip.repository.js';
import type { UserRepository } from '../user/domain/user.repository.js';
import type { TokenProvider } from '../../shared/auth/token-provider.interface.js';
import type { TrackingLifecyclePort } from './domain/ports/tracking-lifecycle.port.js';
import type { CurrentLocationRepository } from './domain/current-location.repository.js';
import { CurrentLocationPrismaRepository } from './infrastructure/current-location.prisma-repository.js';
import { TrackingBroadcastService } from './application/services/tracking-broadcast.service.js';
import { TrackingContextService } from './application/services/tracking-context.service.js';
import { TrackingStatusService } from './application/services/tracking-status.service.js';
import { TrackingStalenessSweepService } from './application/services/tracking-staleness-sweep.service.js';
import { UpsertCurrentLocationUseCase } from './application/use-cases/upsert-current-location.use-case.js';
import { GetEmployeeLocationUseCase } from './application/use-cases/get-employee-location.use-case.js';
import { GetEmployeeTrackingStatusUseCase } from './application/use-cases/get-employee-tracking-status.use-case.js';
import { GetTripTrackingLocationsUseCase } from './application/use-cases/get-trip-tracking-locations.use-case.js';
import { ListActiveTripLocationsUseCase } from './application/use-cases/list-active-trip-locations.use-case.js';
import { AdminListCompanyTripLocationsUseCase } from './application/use-cases/admin-list-company-trip-locations.use-case.js';
import { GetTrackingSessionUseCase } from './application/use-cases/get-tracking-session.use-case.js';
import { ListAvailableTrackingTripsUseCase } from './application/use-cases/list-available-tracking-trips.use-case.js';
import { StopTrackingForTripUseCase } from './application/use-cases/stop-tracking-for-trip.use-case.js';
import { TrackingSessionService } from './application/services/tracking-session.service.js';
import { TrackingLifecycleAdapter } from './infrastructure/tracking-lifecycle.adapter.js';
import { TrackingController } from './presentation/tracking.controller.js';
import { TrackingWebSocketGateway } from './presentation/tracking-websocket.gateway.js';

export { createTrackingRoutes } from './presentation/tracking.routes.js';
export type { TrackingLifecyclePort } from './domain/ports/tracking-lifecycle.port.js';
export { NoOpTrackingLifecyclePort } from './domain/ports/tracking-lifecycle.port.js';

export interface TrackingModuleDependencies {
  tokenProvider: TokenProvider;
  userRepository: UserRepository;
  tripRepository: TripRepository;
  employeeRepository: EmployeeRepository;
  companyRepository: CompanyRepository;
  currentLocationRepository?: CurrentLocationRepository;
}

export interface TrackingModule {
  trackingController: TrackingController;
  trackingWebSocketGateway: TrackingWebSocketGateway;
  trackingLifecyclePort: TrackingLifecyclePort;
  trackingStalenessSweepService: TrackingStalenessSweepService;
}

export function buildTrackingModule(deps: TrackingModuleDependencies): TrackingModule {
  const currentLocationRepository =
    deps.currentLocationRepository ?? new CurrentLocationPrismaRepository();
  const broadcastService = new TrackingBroadcastService();
  const trackingContextService = new TrackingContextService(
    deps.userRepository,
    deps.tripRepository,
  );
  const trackingStatusService = new TrackingStatusService();

  const upsertCurrentLocationUseCase = new UpsertCurrentLocationUseCase(
    currentLocationRepository,
    trackingContextService,
    broadcastService,
  );

  const listActiveTripLocationsUseCase = new ListActiveTripLocationsUseCase(
    deps.tripRepository,
    currentLocationRepository,
  );

  const stopTrackingForTripUseCase = new StopTrackingForTripUseCase(
    currentLocationRepository,
    deps.tripRepository,
    broadcastService,
  );

  const trackingLifecyclePort = new TrackingLifecycleAdapter(stopTrackingForTripUseCase);

  const trackingSessionService = new TrackingSessionService(
    deps.userRepository,
    deps.employeeRepository,
    deps.companyRepository,
    deps.tripRepository,
  );

  const trackingController = new TrackingController(
    upsertCurrentLocationUseCase,
    new GetEmployeeLocationUseCase(
      currentLocationRepository,
      deps.employeeRepository,
      deps.tripRepository,
      deps.userRepository,
    ),
    new GetEmployeeTrackingStatusUseCase(
      currentLocationRepository,
      deps.employeeRepository,
      trackingStatusService,
    ),
    new GetTripTrackingLocationsUseCase(deps.tripRepository, currentLocationRepository),
    listActiveTripLocationsUseCase,
    new AdminListCompanyTripLocationsUseCase(
      deps.companyRepository,
      listActiveTripLocationsUseCase,
    ),
    new GetTrackingSessionUseCase(trackingSessionService),
    new ListAvailableTrackingTripsUseCase(deps.tripRepository, deps.userRepository),
  );

  const trackingWebSocketGateway = new TrackingWebSocketGateway(
    deps.tokenProvider,
    broadcastService,
    upsertCurrentLocationUseCase,
  );

  const trackingStalenessSweepService = new TrackingStalenessSweepService(
    currentLocationRepository,
    broadcastService,
    trackingStatusService,
  );

  return {
    trackingController,
    trackingWebSocketGateway,
    trackingLifecyclePort,
    trackingStalenessSweepService,
  };
}
