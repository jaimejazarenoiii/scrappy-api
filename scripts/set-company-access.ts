/**
 * Disable or re-enable a company's access without deleting data.
 *
 * Disable:
 *   - company.status → INACTIVE
 *   - all users in the company → INACTIVE
 *   - revoke active refresh sessions (forces re-login)
 *
 * Enable:
 *   - company.status → ACTIVE
 *   - all non-deleted users → ACTIVE
 *
 * Usage:
 *   pnpm run db:disable-company -- --name "Acme Recycling"
 *   pnpm run db:disable-company -- --id <company-uuid>
 *   pnpm run db:enable-company -- --name "Acme Recycling"
 *   pnpm run db:enable-company -- --id <company-uuid>
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Mode = 'disable' | 'enable';

function usage(mode: Mode): never {
  console.error(`Usage:
  pnpm run db:${mode}-company -- --name "Company Name"
  pnpm run db:${mode}-company -- --id <company-uuid>
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

function resolveMode(): Mode {
  const script = process.argv[1] ?? '';
  if (script.includes('enable-company') || process.argv.includes('--enable')) return 'enable';
  if (script.includes('disable-company') || process.argv.includes('--disable')) return 'disable';
  // Fallback: infer from npm script env or default disable
  const npmScript = process.env.npm_lifecycle_event ?? '';
  if (npmScript.includes('enable')) return 'enable';
  if (npmScript.includes('disable')) return 'disable';
  return 'disable';
}

async function main(): Promise<void> {
  const mode = resolveMode();
  const name = readArg('--name');
  const id = readArg('--id');

  if ((!name && !id) || (name && id)) usage(mode);

  const company = await prisma.company.findFirst({
    where: {
      deletedAt: null,
      ...(id ? { id } : { name: name! }),
    },
  });

  if (!company) {
    throw new Error(id ? `Company not found: ${id}` : `Company not found: "${name}"`);
  }

  const users = await prisma.user.findMany({
    where: { companyId: company.id, deletedAt: null },
    select: { id: true, email: true, role: true, status: true },
  });

  if (mode === 'disable') {
    const result = await prisma.$transaction(async (tx) => {
      const updatedCompany = await tx.company.update({
        where: { id: company.id },
        data: { status: 'INACTIVE' },
      });

      const userUpdate = await tx.user.updateMany({
        where: { companyId: company.id, deletedAt: null },
        data: { status: 'INACTIVE' },
      });

      const sessionUpdate = await tx.refreshSession.updateMany({
        where: {
          userId: { in: users.map((user) => user.id) },
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      return { updatedCompany, userUpdate, sessionUpdate };
    });

    console.log('\nCompany access disabled (data kept).');
    console.log(`  Company:  ${result.updatedCompany.name} (${result.updatedCompany.id})`);
    console.log(`  Status:   ${result.updatedCompany.status}`);
    console.log(`  Users:    ${result.userUpdate.count} set to INACTIVE`);
    console.log(`  Sessions: ${result.sessionUpdate.count} revoked`);
    for (const user of users) {
      console.log(`    - ${user.email} (${user.role})`);
    }
    console.log('\nUsers can no longer log in until re-enabled.');
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedCompany = await tx.company.update({
      where: { id: company.id },
      data: { status: 'ACTIVE' },
    });

    const userUpdate = await tx.user.updateMany({
      where: { companyId: company.id, deletedAt: null },
      data: { status: 'ACTIVE' },
    });

    return { updatedCompany, userUpdate };
  });

  console.log('\nCompany access re-enabled.');
  console.log(`  Company: ${result.updatedCompany.name} (${result.updatedCompany.id})`);
  console.log(`  Status:  ${result.updatedCompany.status}`);
  console.log(`  Users:   ${result.userUpdate.count} set to ACTIVE`);
  for (const user of users) {
    console.log(`    - ${user.email} (${user.role})`);
  }
  console.log('\nUsers can log in again with their existing passwords.');
}

main()
  .catch(async (error) => {
    console.error(
      '\nFailed to update company access:',
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
