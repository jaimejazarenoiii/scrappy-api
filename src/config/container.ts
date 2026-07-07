import { BcryptPasswordHasher } from '../modules/auth/infrastructure/bcrypt-password-hasher.js';
import { JwtTokenProvider } from '../modules/auth/infrastructure/jwt-token-provider.js';
import { AuthController } from '../modules/auth/presentation/auth.controller.js';
import { LoginUseCase } from '../modules/auth/application/use-cases/login.use-case.js';
import { LogoutUseCase } from '../modules/auth/application/use-cases/logout.use-case.js';
import { RefreshSessionUseCase } from '../modules/auth/application/use-cases/refresh-session.use-case.js';
import { ForgotPasswordPlaceholderUseCase } from '../modules/auth/application/use-cases/forgot-password-placeholder.use-case.js';
import { CompanyPrismaRepository } from '../modules/company/infrastructure/company.prisma-repository.js';
import { UserPrismaRepository } from '../modules/user/infrastructure/user.prisma-repository.js';
import { SessionPrismaRepository } from '../modules/session/infrastructure/session.prisma-repository.js';
import { EmployeePrismaRepository } from '../modules/employee/infrastructure/employee.prisma-repository.js';
import { BranchPrismaRepository } from '../modules/branch/infrastructure/branch.prisma-repository.js';
import { WarehousePrismaRepository } from '../modules/warehouse/infrastructure/warehouse.prisma-repository.js';
import { VehiclePrismaRepository } from '../modules/vehicle/infrastructure/vehicle.prisma-repository.js';
import { CompanyController } from '../modules/company/presentation/company.controller.js';
import { CreateCompanyWithOwnerUseCase } from '../modules/company/application/use-cases/create-company-with-owner.use-case.js';
import { GetCompanyUseCase } from '../modules/company/application/use-cases/get-company.use-case.js';
import { UpdateCompanyUseCase } from '../modules/company/application/use-cases/update-company.use-case.js';
import { ArchiveCompanyUseCase } from '../modules/company/application/use-cases/archive-company.use-case.js';
import { UserController } from '../modules/user/presentation/user.controller.js';
import { GetCurrentUserUseCase } from '../modules/user/application/use-cases/get-current-user.use-case.js';
import { EmployeeController } from '../modules/employee/presentation/employee.controller.js';
import { CreateEmployeeUseCase } from '../modules/employee/application/use-cases/create-employee.use-case.js';
import { GetEmployeeUseCase } from '../modules/employee/application/use-cases/get-employee.use-case.js';
import { UpdateEmployeeUseCase } from '../modules/employee/application/use-cases/update-employee.use-case.js';
import { ArchiveEmployeeUseCase } from '../modules/employee/application/use-cases/archive-employee.use-case.js';
import { LinkEmployeeToUserUseCase } from '../modules/employee/application/use-cases/link-employee-to-user.use-case.js';
import { BranchController } from '../modules/branch/presentation/branch.controller.js';
import { CreateBranchUseCase } from '../modules/branch/application/use-cases/create-branch.use-case.js';
import { GetBranchUseCase } from '../modules/branch/application/use-cases/get-branch.use-case.js';
import { UpdateBranchUseCase } from '../modules/branch/application/use-cases/update-branch.use-case.js';
import { ArchiveBranchUseCase } from '../modules/branch/application/use-cases/archive-branch.use-case.js';
import { ListBranchesUseCase } from '../modules/branch/application/use-cases/list-branches.use-case.js';
import { WarehouseController } from '../modules/warehouse/presentation/warehouse.controller.js';
import { CreateWarehouseUseCase } from '../modules/warehouse/application/use-cases/create-warehouse.use-case.js';
import { GetWarehouseUseCase } from '../modules/warehouse/application/use-cases/get-warehouse.use-case.js';
import { UpdateWarehouseUseCase } from '../modules/warehouse/application/use-cases/update-warehouse.use-case.js';
import { ArchiveWarehouseUseCase } from '../modules/warehouse/application/use-cases/archive-warehouse.use-case.js';
import { ListWarehousesUseCase } from '../modules/warehouse/application/use-cases/list-warehouses.use-case.js';
import { VehicleController } from '../modules/vehicle/presentation/vehicle.controller.js';
import { CreateVehicleUseCase } from '../modules/vehicle/application/use-cases/create-vehicle.use-case.js';
import { GetVehicleUseCase } from '../modules/vehicle/application/use-cases/get-vehicle.use-case.js';
import { UpdateVehicleUseCase } from '../modules/vehicle/application/use-cases/update-vehicle.use-case.js';
import { ArchiveVehicleUseCase } from '../modules/vehicle/application/use-cases/archive-vehicle.use-case.js';
import { ListVehiclesUseCase } from '../modules/vehicle/application/use-cases/list-vehicles.use-case.js';
import type { TokenProvider } from '../shared/auth/token-provider.interface.js';
import type { PasswordHasher } from '../shared/auth/password-hasher.interface.js';
import type { CompanyRepository } from '../modules/company/domain/company.repository.js';
import type { UserRepository } from '../modules/user/domain/user.repository.js';
import type { SessionRepository } from '../modules/session/domain/session.repository.js';
import type { EmployeeRepository } from '../modules/employee/domain/employee.repository.js';
import type { BranchRepository } from '../modules/branch/domain/branch.repository.js';
import type { WarehouseRepository } from '../modules/warehouse/domain/warehouse.repository.js';
import type { VehicleRepository } from '../modules/vehicle/domain/vehicle.repository.js';

export interface Container {
  tokenProvider: TokenProvider;
  companyController: CompanyController;
  authController: AuthController;
  userController: UserController;
  employeeController: EmployeeController;
  branchController: BranchController;
  warehouseController: WarehouseController;
  vehicleController: VehicleController;
  healthIndicator?: { check: () => Promise<boolean> };
}

export interface ContainerOverrides {
  tokenProvider?: TokenProvider;
  passwordHasher?: PasswordHasher;
  companyRepository?: CompanyRepository;
  userRepository?: UserRepository;
  sessionRepository?: SessionRepository;
  employeeRepository?: EmployeeRepository;
  branchRepository?: BranchRepository;
  warehouseRepository?: WarehouseRepository;
  vehicleRepository?: VehicleRepository;
  healthIndicator?: { check: () => Promise<boolean> };
}

export function createContainer(overrides: ContainerOverrides = {}): Container {
  const companyRepository = overrides.companyRepository ?? new CompanyPrismaRepository();
  const userRepository = overrides.userRepository ?? new UserPrismaRepository();
  const employeeRepository = overrides.employeeRepository ?? new EmployeePrismaRepository();
  const branchRepository = overrides.branchRepository ?? new BranchPrismaRepository();
  const warehouseRepository = overrides.warehouseRepository ?? new WarehousePrismaRepository();
  const vehicleRepository = overrides.vehicleRepository ?? new VehiclePrismaRepository();
  const sessionRepository = overrides.sessionRepository ?? new SessionPrismaRepository();
  const passwordHasher = overrides.passwordHasher ?? new BcryptPasswordHasher();
  const tokenProvider = overrides.tokenProvider ?? new JwtTokenProvider();

  return {
    tokenProvider,
    healthIndicator: overrides.healthIndicator,
    companyController: new CompanyController(
      new CreateCompanyWithOwnerUseCase(companyRepository, userRepository, passwordHasher),
      new GetCompanyUseCase(companyRepository),
      new UpdateCompanyUseCase(companyRepository),
      new ArchiveCompanyUseCase(companyRepository),
    ),
    authController: new AuthController(
      new LoginUseCase(
        userRepository,
        companyRepository,
        sessionRepository,
        passwordHasher,
        tokenProvider,
      ),
      new LogoutUseCase(sessionRepository),
      new RefreshSessionUseCase(sessionRepository, tokenProvider),
      new ForgotPasswordPlaceholderUseCase(),
    ),
    userController: new UserController(new GetCurrentUserUseCase(userRepository)),
    employeeController: new EmployeeController(
      new CreateEmployeeUseCase(employeeRepository),
      new GetEmployeeUseCase(employeeRepository),
      new UpdateEmployeeUseCase(employeeRepository),
      new ArchiveEmployeeUseCase(employeeRepository),
      new LinkEmployeeToUserUseCase(employeeRepository, userRepository),
    ),
    branchController: new BranchController(
      new CreateBranchUseCase(branchRepository),
      new GetBranchUseCase(branchRepository),
      new UpdateBranchUseCase(branchRepository),
      new ArchiveBranchUseCase(branchRepository),
      new ListBranchesUseCase(branchRepository),
    ),
    warehouseController: new WarehouseController(
      new CreateWarehouseUseCase(warehouseRepository),
      new GetWarehouseUseCase(warehouseRepository),
      new UpdateWarehouseUseCase(warehouseRepository),
      new ArchiveWarehouseUseCase(warehouseRepository),
      new ListWarehousesUseCase(warehouseRepository),
    ),
    vehicleController: new VehicleController(
      new CreateVehicleUseCase(vehicleRepository),
      new GetVehicleUseCase(vehicleRepository),
      new UpdateVehicleUseCase(vehicleRepository),
      new ArchiveVehicleUseCase(vehicleRepository),
      new ListVehiclesUseCase(vehicleRepository),
    ),
  };
}
