import request from 'supertest';
import type { Express } from 'express';
import { createCompanyAndLogin, createLinkedEmployeeUser } from './auth-helpers.js';
import { timeInEmployee } from './transaction-helpers.js';

interface UserRepositoryLike {
  create: (input: {
    id: string;
    companyId: string;
    email: string;
    passwordHash: string;
    role: 'EMPLOYEE';
  }) => Promise<{ id: string }>;
  linkEmployee: (userId: string, employeeId: string) => Promise<unknown>;
}

interface EmployeeRepositoryLike {
  create: (input: {
    id: string;
    companyId: string;
    firstName: string;
    lastName: string;
    weeklySalary: number;
  }) => Promise<{ id: string }>;
  linkUser: (employeeId: string, companyId: string, userId: string) => Promise<unknown>;
}

export function buildExpensePayload(overrides: Record<string, unknown> = {}) {
  return {
    expenseDate: new Date().toISOString(),
    category: 'Fuel',
    amount: 1500,
    description: 'Diesel refill for field operations',
    contextType: 'COMPANY',
    ...overrides,
  };
}

export async function setupExpenseActors(
  app: Express,
  userRepository: UserRepositoryLike,
  employeeRepository: EmployeeRepositoryLike,
  email = 'employee@scrappy.test',
) {
  const owner = await createCompanyAndLogin(app);
  const employee = await createLinkedEmployeeUser(
    app,
    userRepository,
    employeeRepository,
    owner.companyId,
    email,
  );
  await timeInEmployee(app, employee.auth);
  return { owner, employee };
}

export async function createDraftExpense(
  app: Express,
  auth: Record<string, string>,
  overrides: Record<string, unknown> = {},
) {
  return request(app).post('/api/v1/expenses').set(auth).send(buildExpensePayload(overrides));
}
