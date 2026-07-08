import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { Express } from 'express';
import { makeCompanyPayload } from '../factories/company.factory.js';

export async function createCompanyAndLogin(app: Express) {
  await request(app).post('/api/v1/companies').send(makeCompanyPayload());
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'owner@scrappy.test', password: 'password123' });
  return {
    auth: { Authorization: `Bearer ${login.body.data.accessToken}` },
    companyId: login.body.data.company.id as string,
    userId: login.body.data.user.id as string,
  };
}

export async function createEmployeeUser(
  userRepository: {
    create: (input: {
      id: string;
      companyId: string;
      email: string;
      passwordHash: string;
      role: 'EMPLOYEE';
    }) => Promise<unknown>;
  },
  companyId: string,
) {
  await userRepository.create({
    id: randomUUID(),
    companyId,
    email: 'employee@scrappy.test',
    passwordHash: 'hashed:password123',
    role: 'EMPLOYEE',
  });
}

export async function loginAsEmployee(app: Express) {
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'employee@scrappy.test', password: 'password123' });
  return { Authorization: `Bearer ${login.body.data.accessToken}` };
}

export async function createLinkedEmployeeUser(
  app: Express,
  userRepository: {
    create: (input: {
      id: string;
      companyId: string;
      email: string;
      passwordHash: string;
      role: 'EMPLOYEE';
    }) => Promise<{ id: string }>;
    linkEmployee: (userId: string, employeeId: string) => Promise<unknown>;
  },
  employeeRepository: {
    create: (input: {
      id: string;
      companyId: string;
      firstName: string;
      lastName: string;
      weeklySalary: number;
    }) => Promise<{ id: string }>;
    linkUser: (employeeId: string, companyId: string, userId: string) => Promise<unknown>;
  },
  companyId: string,
  email = 'employee@scrappy.test',
) {
  const userId = randomUUID();
  const employeeId = randomUUID();
  await employeeRepository.create({
    id: employeeId,
    companyId,
    firstName: 'Jane',
    lastName: 'Worker',
    weeklySalary: 3500,
  });
  await userRepository.create({
    id: userId,
    companyId,
    email,
    passwordHash: 'hashed:password123',
    role: 'EMPLOYEE',
  });
  await employeeRepository.linkUser(employeeId, companyId, userId);
  await userRepository.linkEmployee(userId, employeeId);
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: email, password: 'password123' });
  return {
    auth: { Authorization: `Bearer ${login.body.data.accessToken}` },
    employeeId,
    userId,
  };
}

export async function createLinkedManagerUser(
  app: Express,
  userRepository: {
    create: (input: {
      id: string;
      companyId: string;
      email: string;
      passwordHash: string;
      role: 'MANAGER';
    }) => Promise<{ id: string }>;
    linkEmployee: (userId: string, employeeId: string) => Promise<unknown>;
  },
  employeeRepository: {
    create: (input: {
      id: string;
      companyId: string;
      firstName: string;
      lastName: string;
      weeklySalary: number;
    }) => Promise<{ id: string }>;
    linkUser: (employeeId: string, companyId: string, userId: string) => Promise<unknown>;
  },
  companyId: string,
  email = 'manager-linked@scrappy.test',
) {
  const userId = randomUUID();
  const employeeId = randomUUID();
  await employeeRepository.create({
    id: employeeId,
    companyId,
    firstName: 'Mark',
    lastName: 'Manager',
    weeklySalary: 5000,
  });
  await userRepository.create({
    id: userId,
    companyId,
    email,
    passwordHash: 'hashed:password123',
    role: 'MANAGER',
  });
  await employeeRepository.linkUser(employeeId, companyId, userId);
  await userRepository.linkEmployee(userId, employeeId);
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: email, password: 'password123' });
  return {
    auth: { Authorization: `Bearer ${login.body.data.accessToken}` },
    employeeId,
    userId,
  };
}

export async function createManagerUser(
  app: Express,
  userRepository: {
    create: (input: {
      id: string;
      companyId: string;
      email: string;
      passwordHash: string;
      role: 'MANAGER';
    }) => Promise<{ id: string }>;
  },
  companyId: string,
  email = 'manager@scrappy.test',
) {
  const userId = randomUUID();
  await userRepository.create({
    id: userId,
    companyId,
    email,
    passwordHash: 'hashed:password123',
    role: 'MANAGER',
  });
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: email, password: 'password123' });
  return {
    auth: { Authorization: `Bearer ${login.body.data.accessToken}` },
    userId,
  };
}
