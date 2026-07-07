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
