import request from 'supertest';
import type { Express } from 'express';
import { createCompanyAndLogin, createLinkedEmployeeUser } from './auth-helpers.js';
import { buildTransaction } from '../factories/transaction.factory.js';

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

export async function timeInEmployee(app: Express, auth: Record<string, string>) {
  const res = await request(app).post('/api/v1/workforce/attendance/time-in').set(auth);
  return res;
}

/**
 * Sets up an owner, a linked employee, and times the employee in so they can create transactions.
 */
export async function setupTransactionActors(
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

export async function createDraftTransaction(
  app: Express,
  auth: Record<string, string>,
  assignedEmployeeIds: string[],
  overrides: Record<string, unknown> = {},
) {
  return request(app)
    .post('/api/v1/transactions')
    .set(auth)
    .send(buildTransaction(assignedEmployeeIds, overrides));
}
