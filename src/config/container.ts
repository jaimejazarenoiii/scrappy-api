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
import type { TokenProvider } from '../shared/auth/token-provider.interface.js';
import type { PasswordHasher } from '../shared/auth/password-hasher.interface.js';
import type { CompanyRepository } from '../modules/company/domain/company.repository.js';
import type { UserRepository } from '../modules/user/domain/user.repository.js';
import type { SessionRepository } from '../modules/session/domain/session.repository.js';
import type { EmployeeRepository } from '../modules/employee/domain/employee.repository.js';

export interface Container {
  tokenProvider: TokenProvider;
  companyController: CompanyController;
  authController: AuthController;
  userController: UserController;
  employeeController: EmployeeController;
  healthIndicator?: { check: () => Promise<boolean> };
}

export interface ContainerOverrides {
  tokenProvider?: TokenProvider;
  passwordHasher?: PasswordHasher;
  companyRepository?: CompanyRepository;
  userRepository?: UserRepository;
  sessionRepository?: SessionRepository;
  employeeRepository?: EmployeeRepository;
  healthIndicator?: { check: () => Promise<boolean> };
}

export function createContainer(overrides: ContainerOverrides = {}): Container {
  const companyRepository = overrides.companyRepository ?? new CompanyPrismaRepository();
  const userRepository = overrides.userRepository ?? new UserPrismaRepository();
  const employeeRepository = overrides.employeeRepository ?? new EmployeePrismaRepository();
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
  };
}
