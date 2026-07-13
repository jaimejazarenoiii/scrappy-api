-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- CreateEnum
CREATE TYPE "CompanySubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'GRACE_PERIOD', 'EXPIRED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SubscriptionPeriodStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN "subscriptionStatus" "CompanySubscriptionStatus" NOT NULL DEFAULT 'TRIAL';

-- CreateTable
CREATE TABLE "CompanySubscription" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "planName" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "SubscriptionPeriodStatus" NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanySubscription_companyId_startsAt_idx" ON "CompanySubscription"("companyId", "startsAt");

-- CreateIndex
CREATE INDEX "CompanySubscription_companyId_status_idx" ON "CompanySubscription"("companyId", "status");

-- CreateIndex (partial unique: at most one ACTIVE period per company)
CREATE UNIQUE INDEX "CompanySubscription_companyId_active_unique" ON "CompanySubscription"("companyId") WHERE "status" = 'ACTIVE';

-- AddForeignKey
ALTER TABLE "CompanySubscription" ADD CONSTRAINT "CompanySubscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
