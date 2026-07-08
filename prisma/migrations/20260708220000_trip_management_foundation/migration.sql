-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('DRAFT', 'STARTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TripMemberRole" AS ENUM ('DRIVER', 'HELPER', 'BUYER', 'SUPERVISOR');

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tripNumber" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "notes" TEXT,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "startedByUserId" TEXT,
    "completedByUserId" TEXT,
    "cancelledByUserId" TEXT,
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripMember" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "role" "TripMemberRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripNumberSequence" (
    "companyId" TEXT NOT NULL,
    "sequenceDate" DATE NOT NULL,
    "lastSequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TripNumberSequence_pkey" PRIMARY KEY ("companyId","sequenceDate")
);

-- CreateIndex
CREATE INDEX "Trip_companyId_status_deletedAt_idx" ON "Trip"("companyId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Trip_companyId_scheduledStart_idx" ON "Trip"("companyId", "scheduledStart");

-- CreateIndex
CREATE INDEX "Trip_companyId_tripNumber_idx" ON "Trip"("companyId", "tripNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_companyId_tripNumber_key" ON "Trip"("companyId", "tripNumber");

-- CreateIndex
CREATE INDEX "TripMember_tripId_idx" ON "TripMember"("tripId");

-- CreateIndex
CREATE INDEX "TripMember_employeeId_idx" ON "TripMember"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "TripMember_tripId_employeeId_key" ON "TripMember"("tripId", "employeeId");

-- CreateIndex
CREATE INDEX "TripNumberSequence_companyId_sequenceDate_idx" ON "TripNumberSequence"("companyId", "sequenceDate");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripMember" ADD CONSTRAINT "TripMember_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripMember" ADD CONSTRAINT "TripMember_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- One active STARTED trip per vehicle (per company). Cancelled/completed are allowed.
CREATE UNIQUE INDEX "Trip_companyId_vehicleId_started_unique" ON "Trip"("companyId", "vehicleId")
WHERE "status" = 'STARTED' AND "deletedAt" IS NULL;

