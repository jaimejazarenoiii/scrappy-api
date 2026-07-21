-- AlterTable
ALTER TABLE "Trip" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TripMember" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "CurrentLocation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "tripId" TEXT,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "speed" DECIMAL(8,3),
    "heading" DECIMAL(6,2),
    "accuracy" DECIMAL(8,2),
    "batteryLevel" INTEGER,
    "isMockLocation" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurrentLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CurrentLocation_employeeId_key" ON "CurrentLocation"("employeeId");

-- CreateIndex
CREATE INDEX "CurrentLocation_companyId_employeeId_idx" ON "CurrentLocation"("companyId", "employeeId");

-- CreateIndex
CREATE INDEX "CurrentLocation_companyId_tripId_idx" ON "CurrentLocation"("companyId", "tripId");

-- CreateIndex
CREATE INDEX "CurrentLocation_companyId_lastSeenAt_idx" ON "CurrentLocation"("companyId", "lastSeenAt");

-- AddForeignKey
ALTER TABLE "CurrentLocation" ADD CONSTRAINT "CurrentLocation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentLocation" ADD CONSTRAINT "CurrentLocation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CurrentLocation" ADD CONSTRAINT "CurrentLocation_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
