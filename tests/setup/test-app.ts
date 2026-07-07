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
} from './in-memory-repositories.js';

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
  resetConfigForTests();
  resetLoggerForTests();
}

export function createTestContext() {
  setupTestEnv();
  const companyRepository = new InMemoryCompanyRepository();
  const userRepository = new InMemoryUserRepository();
  const employeeRepository = new InMemoryEmployeeRepository();
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
  };
}
