-- AlterTable Company
ALTER TABLE "Company" ADD COLUMN "defaultStrictLoadValidation" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable Trip
ALTER TABLE "Trip" ADD COLUMN "loadEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Trip" ADD COLUMN "strictLoadValidation" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TripLoad" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "notes" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripLoad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripLoadItem" (
    "id" TEXT NOT NULL,
    "tripLoadId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "materialNameNorm" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit" "TransactionItemUnit" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripLoadItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TripLoad_tripId_key" ON "TripLoad"("tripId");
CREATE INDEX "TripLoad_tripId_idx" ON "TripLoad"("tripId");
CREATE INDEX "TripLoadItem_tripLoadId_idx" ON "TripLoadItem"("tripLoadId");
CREATE UNIQUE INDEX "TripLoadItem_tripLoadId_materialNameNorm_key" ON "TripLoadItem"("tripLoadId", "materialNameNorm");

-- AddForeignKey
ALTER TABLE "TripLoad" ADD CONSTRAINT "TripLoad_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TripLoadItem" ADD CONSTRAINT "TripLoadItem_tripLoadId_fkey" FOREIGN KEY ("tripLoadId") REFERENCES "TripLoad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
