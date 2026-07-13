/**
 * Create a platform SUPER_ADMIN account.
 *
 * Usage:
 *   pnpm run db:create-super-admin -- \
 *     --email admin@scrappy.com \
 *     --password 'SecurePass123'
 *
 * Optional:
 *   --company-id <uuid>   attach to an existing company (default: create/reuse "Scrappy Platform")
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10);
const PLATFORM_COMPANY_NAME = 'Scrappy Platform';

function usage(): never {
  console.error(`Usage:
  pnpm run db:create-super-admin -- \\
    --email admin@example.com \\
    --password 'at-least-8-chars' \\
    [--company-id <uuid>]
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

async function resolveCompanyId(explicitCompanyId: string | undefined): Promise<{
  companyId: string;
  companyName: string;
  created: boolean;
}> {
  if (explicitCompanyId) {
    const company = await prisma.company.findFirst({
      where: { id: explicitCompanyId, deletedAt: null },
    });
    if (!company) {
      throw new Error(`Company not found: ${explicitCompanyId}`);
    }
    return { companyId: company.id, companyName: company.name, created: false };
  }

  const existing = await prisma.company.findFirst({
    where: { name: PLATFORM_COMPANY_NAME, deletedAt: null },
  });
  if (existing) {
    return { companyId: existing.id, companyName: existing.name, created: false };
  }

  const company = await prisma.company.create({
    data: {
      id: randomUUID(),
      name: PLATFORM_COMPANY_NAME,
      status: 'ACTIVE',
      subscriptionStatus: 'ACTIVE',
    },
  });
  return { companyId: company.id, companyName: company.name, created: true };
}

async function main(): Promise<void> {
  const email = readArg('--email');
  const password = readArg('--password');
  const companyIdArg = readArg('--company-id');

  if (!email || !password) usage();
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error(`Email already exists: ${email} (role=${existingUser.role})`);
  }

  const company = await resolveCompanyId(companyIdArg);
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const userId = randomUUID();

  const admin = await prisma.user.create({
    data: {
      id: userId,
      companyId: company.companyId,
      email,
      passwordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  console.log('\nSUPER_ADMIN created.');
  console.log(`  User ID:      ${admin.id}`);
  console.log(`  Email:        ${admin.email}`);
  console.log(`  Role:         ${admin.role}`);
  console.log(`  Company ID:   ${company.companyId}`);
  console.log(`  Company name: ${company.companyName}${company.created ? ' (created)' : ''}`);
  console.log('\nLogin with:');
  console.log('  POST /api/v1/admin/auth/login');
  console.log(`  { "identifier": "${email}", "password": "<your-password>" }`);
}

main()
  .catch(async (error) => {
    console.error(
      '\nFailed to create SUPER_ADMIN:',
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
