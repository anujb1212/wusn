-- CreateTable
CREATE TABLE "fields" (
    "id" SERIAL NOT NULL,
    "fieldName" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "soilType" TEXT,
    "recommendedCrop" TEXT,
    "selectedCrop" TEXT,
    "sowingDate" TIMESTAMP(3),
    "cropConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "accumulatedGDD" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastGDDUpdate" TIMESTAMP(3),
    "currentGrowthStage" TEXT,
    "lastIrrigationCheck" TIMESTAMP(3),
    "lastIrrigationAction" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fields_cropConfirmed_lastGDDUpdate_idx" ON "fields"("cropConfirmed", "lastGDDUpdate");
