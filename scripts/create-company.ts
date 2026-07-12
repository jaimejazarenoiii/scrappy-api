/**
 * Create a blank company + owner account (no demo data).
 *
 * Usage:
 *   pnpm run db:create-company -- \
 *     --name "Acme Recycling" \
 *     --owner-email owner@acme.com \
 *     --owner-password 'SecurePass123' \
 *     --contact 09171234567 \
 *     --email office@acme.com \
 *     --address "Quezon City"
 *
 * Optional:
 *   --skip-categories   do not seed default expense categories
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { DEFAULT_EXPENSE_CATEGORIES } from './lib/default-expense-categories.js';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10);

function usage(): never {
  console.error(`Usage:
  pnpm run db:create-company -- \\
    --name "Company Name" \\
    --owner-email owner@example.com \\
    --owner-password 'at-least-8-chars' \\
    [--contact 0917...] \\
    [--email company@example.com] \\
    [--address "City"] \\
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

async function main(): Promise<void> {
  const name = readArg('--name');
  const ownerEmail = readArg('--owner-email');
  const ownerPassword = readArg('--owner-password');
  const contactNumber = readArg('--contact') ?? null;
  const email = readArg('--email') ?? null;
  const address = readArg('--address') ?? null;
  const skipCategories = hasFlag('--skip-categories');

  if (!name || !ownerEmail || !ownerPassword) usage();
  if (ownerPassword.length < 8) {
    throw new Error('Owner password must be at least 8 characters.');
  }

  const existingCompany = await prisma.company.findFirst({
    where: { name, deletedAt: null },
  });
  if (existingCompany) {
    throw new Error(`Company already exists: "${name}" (${existingCompany.id})`);
  }

  const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (existingUser) {
    throw new Error(`Owner email already exists: ${ownerEmail}`);
  }

  const companyId = randomUUID();
  const ownerId = randomUUID();
  const passwordHash = await bcrypt.hash(ownerPassword, BCRYPT_ROUNDS);

  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        id: companyId,
        name,
        contactNumber,
        email,
        address,
        status: 'ACTIVE',
      },
    });

    const owner = await tx.user.create({
      data: {
        id: ownerId,
        companyId: company.id,
        email: ownerEmail,
        passwordHash,
        role: 'OWNER',
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

    return { company, owner };
  });

  console.log('\nCompany created (blank — no employees/branches/demo data).');
  console.log(`  Company ID:   ${result.company.id}`);
  console.log(`  Company name: ${result.company.name}`);
  console.log(`  Owner ID:     ${result.owner.id}`);
  console.log(`  Owner email:  ${result.owner.email}`);
  console.log(`  Owner role:   ${result.owner.role}`);
  console.log(
    `  Categories:   ${skipCategories ? 'skipped' : DEFAULT_EXPENSE_CATEGORIES.join(', ')}`,
  );
  console.log('\nNext: owner logs in and creates employees, branches, etc. in the app.');
}

main()
  .catch(async (error) => {
    console.error('\nFailed to create company:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
