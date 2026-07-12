/**
 * Production seed — run ONCE per company. Does NOT delete any existing data.
 *
 * Creates:
 *   - 1 company
 *   - 1 OWNER
 *   - 1 MANAGER (linked employee EMP-MGR)
 *   - 3 EMPLOYEEs (linked EMP-001..003)
 *   - default expense categories
 *
 * If the company name already exists, exits successfully (idempotent / once-only).
 *
 * Usage (Railway console or local with prod DATABASE_URL):
 *   pnpm run db:seed:prod -- \
 *     --name "Acme Recycling" \
 *     --password 'SecurePass123' \
 *     --email-domain acme.com
 *
 * Optional:
 *   --contact --email --address --owner-email --manager-email
 *   --employee1-email --employee2-email --employee3-email
 *   --skip-categories
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { DEFAULT_EXPENSE_CATEGORIES } from '../src/modules/expense/domain/expense-categories.js';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10);

function usage(): never {
  console.error(`Usage:
  pnpm run db:seed:prod -- \\
    --name "Company Name" \\
    --password 'at-least-8-chars' \\
    [--email-domain example.com] \\
    [--owner-email ...] [--manager-email ...] \\
    [--employee1-email ...] [--employee2-email ...] [--employee3-email ...] \\
    [--contact ...] [--email ...] [--address ...] \\
    [--skip-categories]
`);
  process.exit(1);
}

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith('--')) return undefined;
  return value;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function assertEmailFree(email: string): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error(`Email already exists: ${email}`);
}

async function main(): Promise<void> {
  const name = readArg('--name');
  const password = readArg('--password');
  const emailDomain = readArg('--email-domain') ?? 'example.com';
  const contactNumber = readArg('--contact') ?? null;
  const companyEmail = readArg('--email') ?? null;
  const address = readArg('--address') ?? null;
  const skipCategories = hasFlag('--skip-categories');

  if (!name || !password) usage();
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  const emails = {
    owner: readArg('--owner-email') ?? `owner@${emailDomain}`,
    manager: readArg('--manager-email') ?? `manager@${emailDomain}`,
    employee1: readArg('--employee1-email') ?? `employee1@${emailDomain}`,
    employee2: readArg('--employee2-email') ?? `employee2@${emailDomain}`,
    employee3: readArg('--employee3-email') ?? `employee3@${emailDomain}`,
  };

  const existingCompany = await prisma.company.findFirst({
    where: { name, deletedAt: null },
  });
  if (existingCompany) {
    console.log(`\nProd seed already applied for "${name}" (${existingCompany.id}).`);
    console.log('Skipping — no data was deleted or changed.');
    console.log('Pick a different --name if you need another company.');
    return;
  }

  for (const email of Object.values(emails)) {
    await assertEmailFree(email);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        id: randomUUID(),
        name,
        contactNumber,
        email: companyEmail,
        address,
        status: 'ACTIVE',
      },
    });

    if (!skipCategories) {
      await tx.expenseCategory.createMany({
        data: DEFAULT_EXPENSE_CATEGORIES.map((categoryName, index) => ({
          id: randomUUID(),
          companyId: company.id,
          name: categoryName,
          sortOrder: index,
        })),
      });
    }

    const owner = await tx.user.create({
      data: {
        id: randomUUID(),
        companyId: company.id,
        email: emails.owner,
        passwordHash,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    const managerEmployee = await tx.employee.create({
      data: {
        id: randomUUID(),
        companyId: company.id,
        employeeNumber: 'EMP-MGR',
        firstName: 'Maya',
        lastName: 'Manager',
        contactNumber: '09170000000',
        weeklySalary: 5000,
        status: 'ACTIVE',
      },
    });

    const manager = await tx.user.create({
      data: {
        id: randomUUID(),
        companyId: company.id,
        employeeId: managerEmployee.id,
        email: emails.manager,
        passwordHash,
        role: 'MANAGER',
        status: 'ACTIVE',
      },
    });

    await tx.employee.update({
      where: { id: managerEmployee.id },
      data: { userId: manager.id },
    });

    const employeeDefs = [
      {
        email: emails.employee1,
        number: 'EMP-001',
        firstName: 'Ana',
        lastName: 'Santos',
        weeklySalary: 3500,
        contact: '09170000001',
      },
      {
        email: emails.employee2,
        number: 'EMP-002',
        firstName: 'Ben',
        lastName: 'Reyes',
        weeklySalary: 3800,
        contact: '09170000002',
      },
      {
        email: emails.employee3,
        number: 'EMP-003',
        firstName: 'Carlo',
        lastName: 'Dela Cruz',
        weeklySalary: 4200,
        contact: '09170000003',
      },
    ];

    const employees: { email: string; role: string; employeeNumber: string }[] = [];
    for (const def of employeeDefs) {
      const employee = await tx.employee.create({
        data: {
          id: randomUUID(),
          companyId: company.id,
          employeeNumber: def.number,
          firstName: def.firstName,
          lastName: def.lastName,
          contactNumber: def.contact,
          weeklySalary: def.weeklySalary,
          status: 'ACTIVE',
        },
      });

      const user = await tx.user.create({
        data: {
          id: randomUUID(),
          companyId: company.id,
          employeeId: employee.id,
          email: def.email,
          passwordHash,
          role: 'EMPLOYEE',
          status: 'ACTIVE',
        },
      });

      await tx.employee.update({
        where: { id: employee.id },
        data: { userId: user.id },
      });

      employees.push({
        email: def.email,
        role: 'EMPLOYEE',
        employeeNumber: def.number,
      });
    }

    return {
      company,
      accounts: [
        { email: owner.email, role: 'OWNER', employeeNumber: null as string | null },
        { email: manager.email, role: 'MANAGER', employeeNumber: 'EMP-MGR' },
        ...employees,
      ],
    };
  });

  console.log('\nProd seed complete (no existing data was deleted).');
  console.log(`  Company: ${result.company.name} (${result.company.id})`);
  console.log(`  Shared password: ${password}`);
  console.log('  Accounts:');
  for (const account of result.accounts) {
    const emp = account.employeeNumber ? ` [${account.employeeNumber}]` : '';
    console.log(`    - ${account.email}  (${account.role})${emp}`);
  }
  console.log('\nRe-running with the same --name will skip (once-only).');
}

main()
  .catch(async (error) => {
    console.error('\nProd seed failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
