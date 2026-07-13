import { createApp } from '../../src/app.js';
import { createContainer } from '../../src/config/container.js';
import { JwtTokenProvider } from '../../src/modules/auth/infrastructure/jwt-token-provider.js';
import { resetConfigForTests } from '../../src/config/index.js';
import { resetLoggerForTests } from '../../src/config/logger.js';
import {
  FakePasswordHasher,
  InMemoryAttendanceRepository,
  InMemoryBranchRepository,
  InMemoryCashAdvanceRepository,
  InMemoryCompanyRepository,
  InMemoryEmployeeRepository,
  InMemoryLeaveRepository,
  InMemoryPayrollRepository,
  InMemorySessionRepository,
  InMemoryUserRepository,
  InMemoryVehicleRepository,
  InMemoryWarehouseRepository,
  InMemoryTransactionStore,
  InMemoryTransactionRepository,
  InMemoryTransactionItemRepository,
  InMemoryTransactionAttachmentRepository,
  InMemoryTransactionSuggestionRepository,
  InMemoryTransactionNumberSequenceRepository,
  InMemoryFileStorage,
} from './in-memory-repositories.js';
import { InMemoryAnalyticsQueryRepository } from './in-memory-analytics-query-repository.js';
import { InMemoryReportsQueryRepository } from './in-memory-reports-query-repository.js';
import {
  InMemoryTripRepository,
  InMemoryTripNumberSequenceRepository,
} from './in-memory-trip-repository.js';
import { InMemoryTripReferenceChecker } from './in-memory-trip-reference-checker.js';
import {
  InMemoryExpenseStore,
  InMemoryExpenseRepository,
  InMemoryExpenseAttachmentRepository,
  InMemoryExpenseNumberSequenceRepository,
  InMemoryExpenseFileStorage,
} from './in-memory-expense-repository.js';
import { InMemoryExpenseCategoryRepository } from './in-memory-expense-category-repository.js';

export function setupTestEnv(): void {
  process.env.PORT = '3000';
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/scrappy?schema=public';
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-1234';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-1234';
  process.env.JWT_ACCESS_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.BCRYPT_ROUNDS = '10';
  process.env.CORS_ORIGIN = '*';
  process.env.RATE_LIMIT_WINDOW_MS = '60000';
  process.env.RATE_LIMIT_MAX = '1000';
  process.env.FILE_STORAGE_DRIVER = 'local';
  process.env.UPLOAD_DIR = 'uploads';
  delete process.env.S3_BUCKET;
  delete process.env.S3_REGION;
  delete process.env.S3_ACCESS_KEY_ID;
  delete process.env.S3_SECRET_ACCESS_KEY;
  delete process.env.S3_ENDPOINT;
  resetConfigForTests();
  resetLoggerForTests();
}

export function createTestContext() {
  setupTestEnv();
  const companyRepository = new InMemoryCompanyRepository();
  const userRepository = new InMemoryUserRepository();
  const employeeRepository = new InMemoryEmployeeRepository(userRepository.users);
  const branchRepository = new InMemoryBranchRepository();
  const warehouseRepository = new InMemoryWarehouseRepository();
  const vehicleRepository = new InMemoryVehicleRepository();
  const attendanceRepository = new InMemoryAttendanceRepository();
  const leaveRepository = new InMemoryLeaveRepository();
  const cashAdvanceRepository = new InMemoryCashAdvanceRepository();
  const payrollRepository = new InMemoryPayrollRepository();
  const sessionRepository = new InMemorySessionRepository();
  const passwordHasher = new FakePasswordHasher();
  const tokenProvider = new JwtTokenProvider();
  const transactionStore = new InMemoryTransactionStore();
  const transactionRepository = new InMemoryTransactionRepository(transactionStore);
  const transactionItemRepository = new InMemoryTransactionItemRepository(transactionStore);
  const transactionAttachmentRepository = new InMemoryTransactionAttachmentRepository(
    transactionStore,
  );
  const transactionSuggestionRepository = new InMemoryTransactionSuggestionRepository(
    transactionStore,
  );
  const transactionNumberSequenceRepository = new InMemoryTransactionNumberSequenceRepository(
    transactionStore,
  );
  const fileStorage = new InMemoryFileStorage();
  const analyticsQueryRepository = new InMemoryAnalyticsQueryRepository(
    transactionStore,
    employeeRepository,
    branchRepository,
    warehouseRepository,
    vehicleRepository,
    attendanceRepository,
    payrollRepository,
    leaveRepository,
    cashAdvanceRepository,
  );
  const reportsQueryRepository = new InMemoryReportsQueryRepository(
    transactionStore,
    employeeRepository,
    branchRepository,
    warehouseRepository,
    vehicleRepository,
    attendanceRepository,
    payrollRepository,
    leaveRepository,
    cashAdvanceRepository,
    userRepository,
  );
  const tripReferenceChecker = new InMemoryTripReferenceChecker();
  const tripRepository = new InMemoryTripRepository(vehicleRepository, employeeRepository);
  const tripNumberSequenceRepository = new InMemoryTripNumberSequenceRepository();
  const expenseStore = new InMemoryExpenseStore();
  const expenseAttachmentRepository = new InMemoryExpenseAttachmentRepository(expenseStore);
  const expenseRepository = new InMemoryExpenseRepository(
    expenseStore,
    expenseAttachmentRepository,
  );
  const expenseCategoryRepository = new InMemoryExpenseCategoryRepository();
  const expenseNumberSequenceRepository = new InMemoryExpenseNumberSequenceRepository(expenseStore);
  const expenseFileStorage = new InMemoryExpenseFileStorage();
  const container = createContainer({
    companyRepository,
    userRepository,
    employeeRepository,
    branchRepository,
    warehouseRepository,
    vehicleRepository,
    attendanceSessionRepository: attendanceRepository,
    leaveRecordRepository: leaveRepository,
    cashAdvanceRepository,
    payrollRecordRepository: payrollRepository,
    sessionRepository,
    passwordHasher,
    tokenProvider,
    transactionRepository,
    transactionItemRepository,
    transactionAttachmentRepository,
    transactionSuggestionRepository,
    transactionNumberSequenceRepository,
    fileStorage,
    analyticsQueryRepository,
    reportsQueryRepository,
    tripReferenceChecker,
    tripRepository,
    tripNumberSequenceRepository,
    expenseRepository,
    expenseCategoryRepository,
    expenseAttachmentRepository,
    expenseNumberSequenceRepository,
    expenseFileStorage,
  });
  const app = createApp(container);
  return {
    app,
    companyRepository,
    userRepository,
    employeeRepository,
    branchRepository,
    warehouseRepository,
    vehicleRepository,
    attendanceRepository,
    leaveRepository,
    cashAdvanceRepository,
    payrollRepository,
    sessionRepository,
    passwordHasher,
    tokenProvider,
    transactionStore,
    transactionRepository,
    transactionItemRepository,
    transactionAttachmentRepository,
    transactionSuggestionRepository,
    transactionNumberSequenceRepository,
    fileStorage,
    expenseStore,
    expenseRepository,
    expenseAttachmentRepository,
    expenseNumberSequenceRepository,
    expenseFileStorage,
    tripRepository,
  };
}
