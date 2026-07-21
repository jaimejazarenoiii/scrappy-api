import type { CompanyRepository } from '../company/domain/company.repository.js';
import type { EmployeeRepository } from '../employee/domain/employee.repository.js';
import type { UserRepository } from '../user/domain/user.repository.js';
import type { VehicleRepository } from '../vehicle/domain/vehicle.repository.js';
import type { TransactionRepository } from '../transaction/domain/transaction.repository.js';
import type { TrackingLifecyclePort } from '../tracking/domain/ports/tracking-lifecycle.port.js';
import { NoOpTrackingLifecyclePort } from '../tracking/domain/ports/tracking-lifecycle.port.js';
import type { TripRepository } from './domain/trip.repository.js';
import type { TripLoadRepository } from './domain/trip-load.repository.js';
import type { TripNumberSequenceRepository } from './domain/trip-number-sequence.repository.js';
import { TripNumberService } from './application/services/trip-number.service.js';
import { ListMyTripsUseCase } from './application/use-cases/list-my-trips.use-case.js';
import { ListTripsUseCase } from './application/use-cases/list-trips.use-case.js';
import { GetTripDashboardUseCase } from './application/use-cases/get-trip-dashboard.use-case.js';
import { CreateTripUseCase } from './application/use-cases/create-trip.use-case.js';
import { GetTripUseCase } from './application/use-cases/get-trip.use-case.js';
import { GetTripHistoryUseCase } from './application/use-cases/get-trip-history.use-case.js';
import { ListTripTransactionsUseCase } from './application/use-cases/list-trip-transactions.use-case.js';
import { CreateTripLoadUseCase } from './application/use-cases/create-trip-load.use-case.js';
import { GetTripLoadUseCase } from './application/use-cases/get-trip-load.use-case.js';
import { UpdateTripLoadUseCase } from './application/use-cases/update-trip-load.use-case.js';
import { DeleteTripLoadUseCase } from './application/use-cases/delete-trip-load.use-case.js';
import { AddTripLoadItemUseCase } from './application/use-cases/add-trip-load-item.use-case.js';
import { UpdateTripLoadItemUseCase } from './application/use-cases/update-trip-load-item.use-case.js';
import { RemoveTripLoadItemUseCase } from './application/use-cases/remove-trip-load-item.use-case.js';
import { EnableTripLoadUseCase } from './application/use-cases/enable-trip-load.use-case.js';
import { DisableTripLoadUseCase } from './application/use-cases/disable-trip-load.use-case.js';
import { GetTripLoadSummaryUseCase } from './application/use-cases/get-trip-load-summary.use-case.js';
import { GetCompanyTripLoadSettingsUseCase } from './application/use-cases/get-company-trip-load-settings.use-case.js';
import { UpdateCompanyTripLoadSettingsUseCase } from './application/use-cases/update-company-trip-load-settings.use-case.js';
import { StartTripUseCase } from './application/use-cases/start-trip.use-case.js';
import { AddTripMembersUseCase } from './application/use-cases/add-trip-members.use-case.js';
import { UpdateTripMemberUseCase } from './application/use-cases/update-trip-member.use-case.js';
import { RemoveTripMemberUseCase } from './application/use-cases/remove-trip-member.use-case.js';
import { CompleteTripUseCase } from './application/use-cases/complete-trip.use-case.js';
import { TripController } from './presentation/trip.controller.js';
import { TripLoadController } from './presentation/trip-load.controller.js';

export { createTripRoutes } from './presentation/trip.routes.js';
export { createTripLoadRoutes } from './presentation/trip-load.routes.js';

export interface TripModuleDependencies {
  tripRepository: TripRepository;
  tripNumberSequenceRepository: TripNumberSequenceRepository;
  vehicleRepository: VehicleRepository;
  employeeRepository: EmployeeRepository;
  userRepository: UserRepository;
  transactionRepository: TransactionRepository;
  trackingLifecyclePort?: TrackingLifecyclePort;
}

export interface TripLoadModuleDependencies {
  tripRepository: TripRepository;
  tripLoadRepository: TripLoadRepository;
  transactionRepository: TransactionRepository;
  userRepository: UserRepository;
  companyRepository: CompanyRepository;
}

export function buildTripController(deps: TripModuleDependencies): TripController {
  const tripNumberService = new TripNumberService(deps.tripNumberSequenceRepository);

  return new TripController(
    new ListTripsUseCase(deps.tripRepository),
    new ListMyTripsUseCase(deps.tripRepository, deps.userRepository),
    new GetTripDashboardUseCase(deps.tripRepository),
    new CreateTripUseCase(
      deps.tripRepository,
      tripNumberService,
      deps.vehicleRepository,
      deps.employeeRepository,
    ),
    new GetTripUseCase(deps.tripRepository, deps.userRepository),
    new GetTripHistoryUseCase(deps.tripRepository, deps.userRepository),
    new ListTripTransactionsUseCase(
      deps.tripRepository,
      deps.transactionRepository,
      deps.userRepository,
    ),
    new StartTripUseCase(deps.tripRepository, deps.vehicleRepository),
    new AddTripMembersUseCase(deps.tripRepository, deps.employeeRepository),
    new UpdateTripMemberUseCase(deps.tripRepository),
    new RemoveTripMemberUseCase(deps.tripRepository),
    new CompleteTripUseCase(
      deps.tripRepository,
      deps.vehicleRepository,
      deps.trackingLifecyclePort ?? new NoOpTrackingLifecyclePort(),
    ),
  );
}

export function buildTripLoadController(deps: TripLoadModuleDependencies): TripLoadController {
  return new TripLoadController(
    new CreateTripLoadUseCase(deps.tripRepository, deps.tripLoadRepository, deps.userRepository),
    new GetTripLoadUseCase(
      deps.tripRepository,
      deps.tripLoadRepository,
      deps.transactionRepository,
      deps.userRepository,
    ),
    new UpdateTripLoadUseCase(deps.tripRepository, deps.tripLoadRepository, deps.userRepository),
    new DeleteTripLoadUseCase(deps.tripRepository, deps.tripLoadRepository, deps.userRepository),
    new AddTripLoadItemUseCase(deps.tripRepository, deps.tripLoadRepository, deps.userRepository),
    new UpdateTripLoadItemUseCase(
      deps.tripRepository,
      deps.tripLoadRepository,
      deps.userRepository,
    ),
    new RemoveTripLoadItemUseCase(
      deps.tripRepository,
      deps.tripLoadRepository,
      deps.userRepository,
    ),
    new EnableTripLoadUseCase(deps.tripRepository, deps.companyRepository),
    new DisableTripLoadUseCase(deps.tripRepository, deps.tripLoadRepository),
    new GetTripLoadSummaryUseCase(
      deps.tripRepository,
      deps.tripLoadRepository,
      deps.transactionRepository,
      deps.userRepository,
    ),
    new GetCompanyTripLoadSettingsUseCase(deps.companyRepository),
    new UpdateCompanyTripLoadSettingsUseCase(deps.companyRepository),
  );
}
