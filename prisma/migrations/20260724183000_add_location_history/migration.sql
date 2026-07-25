-- CreateTable
CREATE TABLE "LocationHistory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "accuracy" DECIMAL(8,2),
    "speed" DECIMAL(8,3),
    "heading" DECIMAL(6,2),
    "batteryLevel" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LocationHistory_tripId_employeeId_capturedAt_idx" ON "LocationHistory"("tripId", "employeeId", "capturedAt");

-- CreateIndex
CREATE INDEX "LocationHistory_companyId_tripId_idx" ON "LocationHistory"("companyId", "tripId");

-- CreateIndex
CREATE INDEX "LocationHistory_tripId_idx" ON "LocationHistory"("tripId");

-- AddForeignKey
ALTER TABLE "LocationHistory" ADD CONSTRAINT "LocationHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationHistory" ADD CONSTRAINT "LocationHistory_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationHistory" ADD CONSTRAINT "LocationHistory_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
