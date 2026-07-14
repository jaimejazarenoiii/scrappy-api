import { BcryptPasswordHasher } from '../modules/auth/infrastructure/bcrypt-password-hasher.js';
import { JwtTokenProvider } from '../modules/auth/infrastructure/jwt-token-provider.js';
import { AuthController } from '../modules/auth/presentation/auth.controller.js';
import { LoginUseCase } from '../modules/auth/application/use-cases/login.use-case.js';
import { AdminLoginUseCase } from '../modules/auth/application/use-cases/admin-login.use-case.js';
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
import { LeaveRecordPrismaRepository } from '../modules/leave/infrastructure/leave-record.prisma-repository.js';
import { AttendanceSessionPrismaRepository } from '../modules/attendance/infrastructure/attendance-session.prisma-repository.js';
import { AttendanceController } from '../modules/attendance/presentation/attendance.controller.js';
import { TimeInUseCase } from '../modules/attendance/application/use-cases/time-in.use-case.js';
import { TimeOutUseCase } from '../modules/attendance/application/use-cases/time-out.use-case.js';
import { GetAttendanceStatusUseCase } from '../modules/attendance/application/use-cases/get-attendance-status.use-case.js';
import { ListMyAttendanceUseCase } from '../modules/attendance/application/use-cases/list-my-attendance.use-case.js';
import { ListCompanyAttendanceUseCase } from '../modules/attendance/application/use-cases/list-company-attendance.use-case.js';
import { GetAttendanceDashboardUseCase } from '../modules/attendance/application/use-cases/get-attendance-dashboard.use-case.js';
import { ManageAttendanceUseCase } from '../modules/attendance/application/use-cases/manage-attendance.use-case.js';
import { AttendanceDayStatusService } from '../modules/attendance/application/services/attendance-day-status.service.js';
import { WorkforceDashboardController } from '../modules/workforce-dashboard/presentation/workforce-dashboard.controller.js';
import { GetWorkforceDashboardUseCase } from '../modules/workforce-dashboard/application/use-cases/get-workforce-dashboard.use-case.js';
import { DashboardVisibilityService } from '../modules/workforce-dashboard/application/services/dashboard-visibility.service.js';
import { CompanyController } from '../modules/company/presentation/company.controller.js';
import { AdminCompanyController } from '../modules/company/presentation/admin-company.controller.js';
import { CreateCompanyWithOwnerUseCase } from '../modules/company/application/use-cases/create-company-with-owner.use-case.js';
import { GetCompanyUseCase } from '../modules/company/application/use-cases/get-company.use-case.js';
import { UpdateCompanyUseCase } from '../modules/company/application/use-cases/update-company.use-case.js';
import { ArchiveCompanyUseCase } from '../modules/company/application/use-cases/archive-company.use-case.js';
import { AdminCreateCompanyUseCase } from '../modules/company/application/use-cases/admin-create-company.use-case.js';
import { AdminListCompaniesUseCase } from '../modules/company/application/use-cases/admin-list-companies.use-case.js';
import { AdminGetCompanyUseCase } from '../modules/company/application/use-cases/admin-get-company.use-case.js';
import { AdminCreateCompanyAccountUseCase } from '../modules/company/application/use-cases/admin-create-company-account.use-case.js';
import { AdminListCompanyAccountsUseCase } from '../modules/company/application/use-cases/admin-list-company-accounts.use-case.js';
import { AdminResetCompanyAccountPasswordUseCase } from '../modules/company/application/use-cases/admin-reset-company-account-password.use-case.js';
import { UserController } from '../modules/user/presentation/user.controller.js';
import { GetCurrentUserUseCase } from '../modules/user/application/use-cases/get-current-user.use-case.js';
import { EmployeeController } from '../modules/employee/presentation/employee.controller.js';
import { CreateEmployeeUseCase } from '../modules/employee/application/use-cases/create-employee.use-case.js';
import { GetEmployeeUseCase } from '../modules/employee/application/use-cases/get-employee.use-case.js';
import { UpdateEmployeeUseCase } from '../modules/employee/application/use-cases/update-employee.use-case.js';
import { ArchiveEmployeeUseCase } from '../modules/employee/application/use-cases/archive-employee.use-case.js';
import { LinkEmployeeToUserUseCase } from '../modules/employee/application/use-cases/link-employee-to-user.use-case.js';
import { ListEmployeesUseCase } from '../modules/employee/application/use-cases/list-employees.use-case.js';
import { GetMyEmployeeUseCase } from '../modules/employee/application/use-cases/get-my-employee.use-case.js';
import { GrantSystemAccessUseCase } from '../modules/employee/application/use-cases/grant-system-access.use-case.js';
import { DisableSystemAccessUseCase } from '../modules/employee/application/use-cases/disable-system-access.use-case.js';
import { ChangePasswordUseCase } from '../modules/user/application/use-cases/change-password.use-case.js';
import { GetPasswordStatusUseCase } from '../modules/user/application/use-cases/get-password-status.use-case.js';
import { EnableSystemAccessUseCase } from '../modules/employee/application/use-cases/enable-system-access.use-case.js';
import { ResetEmployeePasswordUseCase } from '../modules/employee/application/use-cases/reset-employee-password.use-case.js';
import { createPasswordChangeGateMiddleware } from '../middleware/password-change-gate.middleware.js';
import type { RequestHandler } from 'express';
import { EmployeeAccountProvisioningService } from '../modules/employee/application/services/employee-account-provisioning.service.js';
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
import { LeaveController } from '../modules/leave/presentation/leave.controller.js';
import { RequestLeaveUseCase } from '../modules/leave/application/use-cases/request-leave.use-case.js';
import { ListMyLeaveUseCase } from '../modules/leave/application/use-cases/list-my-leave.use-case.js';
import { ListCompanyLeaveUseCase } from '../modules/leave/application/use-cases/list-company-leave.use-case.js';
import { GetLeaveDashboardUseCase } from '../modules/leave/application/use-cases/get-leave-dashboard.use-case.js';
import { ManageLeaveUseCase } from '../modules/leave/application/use-cases/manage-leave.use-case.js';
import type { TokenProvider } from '../shared/auth/token-provider.interface.js';
import type { PasswordHasher } from '../shared/auth/password-hasher.interface.js';
import type { CompanyRepository } from '../modules/company/domain/company.repository.js';
import type { UserRepository } from '../modules/user/domain/user.repository.js';
import type { SessionRepository } from '../modules/session/domain/session.repository.js';
import type { EmployeeRepository } from '../modules/employee/domain/employee.repository.js';
import type { BranchRepository } from '../modules/branch/domain/branch.repository.js';
import type { WarehouseRepository } from '../modules/warehouse/domain/warehouse.repository.js';
import type { VehicleRepository } from '../modules/vehicle/domain/vehicle.repository.js';
import type { LeaveRecordRepository } from '../modules/leave/domain/leave-record.repository.js';
import type { AttendanceSessionRepository } from '../modules/attendance/domain/attendance-session.repository.js';
import { CashAdvancePrismaRepository } from '../modules/cash-advance/infrastructure/cash-advance.prisma-repository.js';
import { CashAdvanceController } from '../modules/cash-advance/presentation/cash-advance.controller.js';
import { CreateCashAdvanceUseCase } from '../modules/cash-advance/application/use-cases/create-cash-advance.use-case.js';
import { ListMyCashAdvancesUseCase } from '../modules/cash-advance/application/use-cases/list-my-cash-advances.use-case.js';
import { ListCompanyCashAdvancesUseCase } from '../modules/cash-advance/application/use-cases/list-company-cash-advances.use-case.js';
import type { CashAdvanceRepository } from '../modules/cash-advance/domain/cash-advance.repository.js';
import { PayrollRecordPrismaRepository } from '../modules/payroll/infrastructure/payroll-record.prisma-repository.js';
import { PayrollController } from '../modules/payroll/presentation/payroll.controller.js';
import { GenerateWeeklyPayrollUseCase } from '../modules/payroll/application/use-cases/generate-weekly-payroll.use-case.js';
import { ListPayrollHistoryUseCase } from '../modules/payroll/application/use-cases/list-payroll-history.use-case.js';
import { GetPayrollRecordUseCase } from '../modules/payroll/application/use-cases/get-payroll-record.use-case.js';
import { MarkPayrollPaidUseCase } from '../modules/payroll/application/use-cases/mark-payroll-paid.use-case.js';
import type { PayrollRecordRepository } from '../modules/payroll/domain/payroll-record.repository.js';
import { TransactionPrismaRepository } from '../modules/transaction/infrastructure/transaction.prisma-repository.js';
import { TransactionItemPrismaRepository } from '../modules/transaction/infrastructure/transaction-item.prisma-repository.js';
import { TransactionAttachmentPrismaRepository } from '../modules/transaction/infrastructure/transaction-attachment.prisma-repository.js';
import { TransactionSuggestionPrismaRepository } from '../modules/transaction/infrastructure/transaction-suggestion.prisma-repository.js';
import { TransactionNumberSequencePrismaRepository } from '../modules/transaction/infrastructure/transaction-number-sequence.prisma-repository.js';
import { buildTransactionController } from '../modules/transaction/index.js';
import type { TransactionController } from '../modules/transaction/presentation/transaction.controller.js';
import { AnalyticsPrismaQueryRepository } from '../modules/analytics/infrastructure/analytics.prisma-query-repository.js';
import {
  buildAnalyticsController,
  buildAdminAnalyticsController,
} from '../modules/analytics/index.js';
import type { AnalyticsController } from '../modules/analytics/presentation/analytics.controller.js';
import type { AdminAnalyticsController } from '../modules/analytics/presentation/admin-analytics.controller.js';
import type { AnalyticsQueryRepository } from '../modules/analytics/domain/analytics-query.repository.js';
import { ReportsPrismaQueryRepository } from '../modules/reports/infrastructure/reports.prisma-query-repository.js';
import { buildReportsController } from '../modules/reports/index.js';
import type { ReportsController } from '../modules/reports/presentation/reports.controller.js';
import type { ReportsQueryRepository } from '../modules/reports/domain/report-query.repository.js';
import type { TripReferenceChecker } from '../modules/reports/application/services/report-filter-validator.service.js';
import { TripPrismaRepository } from '../modules/trip/infrastructure/trip.prisma-repository.js';
import { TripLoadPrismaRepository } from '../modules/trip/infrastructure/trip-load.prisma-repository.js';
import { TripNumberSequencePrismaRepository } from '../modules/trip/infrastructure/trip-number-sequence.prisma-repository.js';
import { buildTripController, buildTripLoadController } from '../modules/trip/index.js';
import { TripLoadValidationService } from '../modules/trip/application/services/trip-load-validation.service.js';
import type { TripController } from '../modules/trip/presentation/trip.controller.js';
import type { TripLoadController } from '../modules/trip/presentation/trip-load.controller.js';
import type { TripRepository } from '../modules/trip/domain/trip.repository.js';
import type { TripLoadRepository } from '../modules/trip/domain/trip-load.repository.js';
import type { TripNumberSequenceRepository } from '../modules/trip/domain/trip-number-sequence.repository.js';
import { ExpensePrismaRepository } from '../modules/expense/infrastructure/expense.prisma-repository.js';
import { ExpenseCategoryPrismaRepository } from '../modules/expense/infrastructure/expense-category.prisma-repository.js';
import { ExpenseAttachmentPrismaRepository } from '../modules/expense/infrastructure/expense-attachment.prisma-repository.js';
import { ExpenseNumberSequencePrismaRepository } from '../modules/expense/infrastructure/expense-number-sequence.prisma-repository.js';
import { buildExpenseController } from '../modules/expense/index.js';
import type { ExpenseController } from '../modules/expense/presentation/expense.controller.js';
import {
  ActivityLogPrismaRepository,
  ActivityLogRecorder,
  buildActivityLogController,
} from '../modules/activity-log/index.js';
import type { ActivityLogController } from '../modules/activity-log/presentation/activity-log.controller.js';
import type { ActivityLogRepository } from '../modules/activity-log/domain/activity-log.repository.js';
import { buildSubscriptionController } from '../modules/subscription/index.js';
import type { SubscriptionController } from '../modules/subscription/presentation/subscription.controller.js';
import { CompanySubscriptionPrismaRepository } from '../modules/subscription/infrastructure/company-subscription.prisma-repository.js';
import type { CompanySubscriptionRepository } from '../modules/subscription/domain/company-subscription.repository.js';
import { registerActivityLogRecorder } from '../shared/audit/activity-log-bridge.js';
import type { ExpenseRepository } from '../modules/expense/domain/expense.repository.js';
import type { ExpenseCategoryRepository } from '../modules/expense/domain/expense-category.repository.js';
import type { ExpenseAttachmentRepository } from '../modules/expense/domain/expense-attachment.repository.js';
import type { ExpenseNumberSequenceRepository } from '../modules/expense/domain/expense-number-sequence.repository.js';
import type { ExpenseFileStorage } from '../modules/expense/infrastructure/file-storage/expense-file-storage.js';
import { createAttachmentFileStorages } from '../shared/storage/create-attachment-file-storages.js';
import type { TransactionRepository } from '../modules/transaction/domain/transaction.repository.js';
import type { TransactionItemRepository } from '../modules/transaction/domain/transaction-item.repository.js';
import type { TransactionAttachmentRepository } from '../modules/transaction/domain/transaction-attachment.repository.js';
import type { TransactionSuggestionRepository } from '../modules/transaction/domain/transaction-suggestion.repository.js';
import type { TransactionNumberSequenceRepository } from '../modules/transaction/domain/transaction-number-sequence.repository.js';
import type { FileStorage } from '../modules/transaction/infrastructure/file-storage/file-storage.interface.js';

export interface Container {
  tokenProvider: TokenProvider;
  passwordChangeGate: RequestHandler;
  companyController: CompanyController;
  adminCompanyController: AdminCompanyController;
  authController: AuthController;
  userController: UserController;
  employeeController: EmployeeController;
  branchController: BranchController;
  warehouseController: WarehouseController;
  vehicleController: VehicleController;
  cashAdvanceController: CashAdvanceController;
  payrollController: PayrollController;
  leaveController: LeaveController;
  attendanceController: AttendanceController;
  workforceDashboardController: WorkforceDashboardController;
  transactionController: TransactionController;
  analyticsController: AnalyticsController;
  adminAnalyticsController: AdminAnalyticsController;
  reportsController: ReportsController;
  tripController: TripController;
  tripLoadController: TripLoadController;
  expenseController: ExpenseController;
  activityLogController: ActivityLogController;
  subscriptionController: SubscriptionController;
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
  cashAdvanceRepository?: CashAdvanceRepository;
  payrollRecordRepository?: PayrollRecordRepository;
  leaveRecordRepository?: LeaveRecordRepository;
  attendanceSessionRepository?: AttendanceSessionRepository;
  transactionRepository?: TransactionRepository;
  transactionItemRepository?: TransactionItemRepository;
  transactionAttachmentRepository?: TransactionAttachmentRepository;
  transactionSuggestionRepository?: TransactionSuggestionRepository;
  transactionNumberSequenceRepository?: TransactionNumberSequenceRepository;
  fileStorage?: FileStorage;
  analyticsQueryRepository?: AnalyticsQueryRepository;
  reportsQueryRepository?: ReportsQueryRepository;
  tripReferenceChecker?: TripReferenceChecker;
  tripRepository?: TripRepository;
  tripLoadRepository?: TripLoadRepository;
  tripNumberSequenceRepository?: TripNumberSequenceRepository;
  expenseRepository?: ExpenseRepository;
  expenseCategoryRepository?: ExpenseCategoryRepository;
  expenseAttachmentRepository?: ExpenseAttachmentRepository;
  expenseNumberSequenceRepository?: ExpenseNumberSequenceRepository;
  expenseFileStorage?: ExpenseFileStorage;
  activityLogRepository?: ActivityLogRepository;
  companySubscriptionRepository?: CompanySubscriptionRepository;
  healthIndicator?: { check: () => Promise<boolean> };
}

export function createContainer(overrides: ContainerOverrides = {}): Container {
  const companyRepository = overrides.companyRepository ?? new CompanyPrismaRepository();
  const userRepository = overrides.userRepository ?? new UserPrismaRepository();
  const employeeRepository = overrides.employeeRepository ?? new EmployeePrismaRepository();
  const branchRepository = overrides.branchRepository ?? new BranchPrismaRepository();
  const warehouseRepository = overrides.warehouseRepository ?? new WarehousePrismaRepository();
  const vehicleRepository = overrides.vehicleRepository ?? new VehiclePrismaRepository();
  const cashAdvanceRepository =
    overrides.cashAdvanceRepository ?? new CashAdvancePrismaRepository();
  const payrollRecordRepository =
    overrides.payrollRecordRepository ?? new PayrollRecordPrismaRepository();
  const leaveRecordRepository =
    overrides.leaveRecordRepository ?? new LeaveRecordPrismaRepository();
  const attendanceSessionRepository =
    overrides.attendanceSessionRepository ?? new AttendanceSessionPrismaRepository();
  const sessionRepository = overrides.sessionRepository ?? new SessionPrismaRepository();
  const passwordHasher = overrides.passwordHasher ?? new BcryptPasswordHasher();
  const tokenProvider = overrides.tokenProvider ?? new JwtTokenProvider();
  const transactionRepository =
    overrides.transactionRepository ?? new TransactionPrismaRepository();
  const transactionItemRepository =
    overrides.transactionItemRepository ?? new TransactionItemPrismaRepository();
  const transactionAttachmentRepository =
    overrides.transactionAttachmentRepository ?? new TransactionAttachmentPrismaRepository();
  const transactionSuggestionRepository =
    overrides.transactionSuggestionRepository ?? new TransactionSuggestionPrismaRepository();
  const transactionNumberSequenceRepository =
    overrides.transactionNumberSequenceRepository ??
    new TransactionNumberSequencePrismaRepository();
  const resolvedStorages =
    overrides.fileStorage && overrides.expenseFileStorage ? null : createAttachmentFileStorages();
  const fileStorage = overrides.fileStorage ?? resolvedStorages!.fileStorage;
  const analyticsQueryRepository =
    overrides.analyticsQueryRepository ?? new AnalyticsPrismaQueryRepository();
  const reportsQueryRepository =
    overrides.reportsQueryRepository ?? new ReportsPrismaQueryRepository();
  const tripRepository = overrides.tripRepository ?? new TripPrismaRepository();
  const tripLoadRepository = overrides.tripLoadRepository ?? new TripLoadPrismaRepository();
  const tripNumberSequenceRepository =
    overrides.tripNumberSequenceRepository ?? new TripNumberSequencePrismaRepository();
  const tripLoadValidationService = new TripLoadValidationService(
    tripLoadRepository,
    transactionRepository,
  );
  const expenseRepository = overrides.expenseRepository ?? new ExpensePrismaRepository();
  const expenseCategoryRepository =
    overrides.expenseCategoryRepository ?? new ExpenseCategoryPrismaRepository();
  const expenseAttachmentRepository =
    overrides.expenseAttachmentRepository ?? new ExpenseAttachmentPrismaRepository();
  const expenseNumberSequenceRepository =
    overrides.expenseNumberSequenceRepository ?? new ExpenseNumberSequencePrismaRepository();
  const expenseFileStorage = overrides.expenseFileStorage ?? resolvedStorages!.expenseFileStorage;
  const activityLogRepository =
    overrides.activityLogRepository ?? new ActivityLogPrismaRepository();
  const companySubscriptionRepository =
    overrides.companySubscriptionRepository ?? new CompanySubscriptionPrismaRepository();
  const activityLogRecorder = new ActivityLogRecorder(activityLogRepository, userRepository);
  registerActivityLogRecorder(activityLogRecorder);

  const employeeAccountProvisioningService = new EmployeeAccountProvisioningService(
    employeeRepository,
    userRepository,
    passwordHasher,
  );

  return {
    tokenProvider,
    healthIndicator: overrides.healthIndicator,
    companyController: new CompanyController(
      new CreateCompanyWithOwnerUseCase(companyRepository, userRepository, passwordHasher),
      new GetCompanyUseCase(companyRepository),
      new UpdateCompanyUseCase(companyRepository),
      new ArchiveCompanyUseCase(companyRepository),
    ),
    adminCompanyController: new AdminCompanyController(
      new AdminCreateCompanyUseCase(companyRepository),
      new AdminListCompaniesUseCase(companyRepository),
      new AdminGetCompanyUseCase(companyRepository),
      new AdminCreateCompanyAccountUseCase(companyRepository, employeeAccountProvisioningService),
      new AdminListCompanyAccountsUseCase(companyRepository, userRepository, employeeRepository),
      new AdminResetCompanyAccountPasswordUseCase(
        companyRepository,
        userRepository,
        passwordHasher,
        sessionRepository,
      ),
    ),
    authController: new AuthController(
      new LoginUseCase(
        userRepository,
        companyRepository,
        sessionRepository,
        passwordHasher,
        tokenProvider,
      ),
      new AdminLoginUseCase(
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
    userController: new UserController(
      new GetCurrentUserUseCase(userRepository),
      new ChangePasswordUseCase(userRepository, passwordHasher, sessionRepository),
      new GetPasswordStatusUseCase(userRepository),
    ),
    employeeController: new EmployeeController(
      new CreateEmployeeUseCase(employeeRepository, employeeAccountProvisioningService),
      new GetEmployeeUseCase(employeeRepository),
      new UpdateEmployeeUseCase(employeeRepository),
      new ArchiveEmployeeUseCase(employeeRepository),
      new LinkEmployeeToUserUseCase(employeeRepository, userRepository),
      new ListEmployeesUseCase(employeeRepository),
      new GetMyEmployeeUseCase(userRepository, employeeRepository),
      new GrantSystemAccessUseCase(employeeRepository, employeeAccountProvisioningService),
      new DisableSystemAccessUseCase(employeeRepository, userRepository, sessionRepository),
      new EnableSystemAccessUseCase(employeeRepository, userRepository),
      new ResetEmployeePasswordUseCase(
        employeeRepository,
        userRepository,
        passwordHasher,
        sessionRepository,
      ),
    ),
    passwordChangeGate: createPasswordChangeGateMiddleware(userRepository),
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
    cashAdvanceController: new CashAdvanceController(
      new CreateCashAdvanceUseCase(cashAdvanceRepository, employeeRepository),
      new ListMyCashAdvancesUseCase(cashAdvanceRepository, userRepository),
      new ListCompanyCashAdvancesUseCase(cashAdvanceRepository),
    ),
    payrollController: new PayrollController(
      new GenerateWeeklyPayrollUseCase(
        payrollRecordRepository,
        employeeRepository,
        cashAdvanceRepository,
      ),
      new ListPayrollHistoryUseCase(payrollRecordRepository, userRepository),
      new GetPayrollRecordUseCase(payrollRecordRepository, userRepository),
      new MarkPayrollPaidUseCase(payrollRecordRepository, cashAdvanceRepository),
    ),
    leaveController: new LeaveController(
      new RequestLeaveUseCase(leaveRecordRepository, employeeRepository, userRepository),
      new ListMyLeaveUseCase(leaveRecordRepository, userRepository),
      new ListCompanyLeaveUseCase(leaveRecordRepository, employeeRepository),
      new GetLeaveDashboardUseCase(employeeRepository, leaveRecordRepository),
      new ManageLeaveUseCase(leaveRecordRepository),
    ),
    attendanceController: new AttendanceController(
      new TimeInUseCase(attendanceSessionRepository, employeeRepository, userRepository),
      new TimeOutUseCase(attendanceSessionRepository, userRepository),
      new GetAttendanceStatusUseCase(attendanceSessionRepository, userRepository),
      new ListMyAttendanceUseCase(attendanceSessionRepository, userRepository),
      new ListCompanyAttendanceUseCase(attendanceSessionRepository, employeeRepository),
      new GetAttendanceDashboardUseCase(
        employeeRepository,
        attendanceSessionRepository,
        leaveRecordRepository,
        new AttendanceDayStatusService(),
      ),
      new ManageAttendanceUseCase(attendanceSessionRepository),
    ),
    workforceDashboardController: new WorkforceDashboardController(
      new GetWorkforceDashboardUseCase(
        attendanceSessionRepository,
        leaveRecordRepository,
        cashAdvanceRepository,
        payrollRecordRepository,
        userRepository,
        new DashboardVisibilityService(),
      ),
    ),
    transactionController: buildTransactionController({
      transactionRepository,
      transactionItemRepository,
      transactionAttachmentRepository,
      transactionSuggestionRepository,
      transactionNumberSequenceRepository,
      companyRepository,
      fileStorage,
      userRepository,
      employeeRepository,
      attendanceRepository: attendanceSessionRepository,
      branchRepository,
      warehouseRepository,
      tripRepository,
      tripLoadValidationService,
    }),
    analyticsController: buildAnalyticsController({
      analyticsQueryRepository,
      branchRepository,
      warehouseRepository,
      vehicleRepository,
      employeeRepository,
    }),
    adminAnalyticsController: buildAdminAnalyticsController({
      analyticsQueryRepository,
      branchRepository,
      warehouseRepository,
      vehicleRepository,
      employeeRepository,
      companyRepository,
    }),
    reportsController: buildReportsController({
      reportsQueryRepository,
      branchRepository,
      warehouseRepository,
      vehicleRepository,
      employeeRepository,
      companyRepository,
      tripReferenceChecker: overrides.tripReferenceChecker,
    }),
    tripController: buildTripController({
      tripRepository,
      tripNumberSequenceRepository,
      vehicleRepository,
      employeeRepository,
      userRepository,
      transactionRepository,
    }),
    tripLoadController: buildTripLoadController({
      tripRepository,
      tripLoadRepository,
      transactionRepository,
      userRepository,
      companyRepository,
    }),
    expenseController: buildExpenseController({
      expenseRepository,
      expenseCategoryRepository,
      expenseAttachmentRepository,
      expenseNumberSequenceRepository,
      expenseFileStorage,
      userRepository,
      attendanceRepository: attendanceSessionRepository,
      branchRepository,
      warehouseRepository,
      vehicleRepository,
      tripRepository,
    }),
    activityLogController: buildActivityLogController({ activityLogRepository }),
    subscriptionController: buildSubscriptionController({
      companyRepository,
      companySubscriptionRepository,
      userRepository,
      sessionRepository,
    }),
  };
}
