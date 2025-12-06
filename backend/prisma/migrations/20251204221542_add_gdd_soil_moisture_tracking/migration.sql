-- AlterTable
ALTER TABLE "SensorReading" ADD COLUMN     "soilMoistureVWC" DOUBLE PRECISION,
ADD COLUMN     "soilTemperature" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "fields" ADD COLUMN     "linkedNodeId" INTEGER,
ADD COLUMN     "soilTexture" TEXT NOT NULL DEFAULT 'SANDY_LOAM';

-- CreateTable
CREATE TABLE "GDDHistory" (
    "id" SERIAL NOT NULL,
    "nodeId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "avgSoilTemp" DOUBLE PRECISION NOT NULL,
    "minSoilTemp" DOUBLE PRECISION,
    "maxSoilTemp" DOUBLE PRECISION,
    "readingsCount" INTEGER NOT NULL,
    "dailyGDD" DOUBLE PRECISION NOT NULL,
    "cumulativeGDD" DOUBLE PRECISION NOT NULL,
    "cropType" TEXT,
    "baseTemperature" DOUBLE PRECISION,
    "growthStage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GDDHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldConfig" (
    "id" SERIAL NOT NULL,
    "nodeId" INTEGER NOT NULL,
    "fieldName" TEXT NOT NULL,
    "soilTexture" TEXT NOT NULL DEFAULT 'SANDY_LOAM',
    "cropType" TEXT,
    "sowingDate" TIMESTAMP(3),
    "expectedHarvestDate" TIMESTAMP(3),
    "baseTemperature" DOUBLE PRECISION,
    "expectedGDDTotal" DOUBLE PRECISION,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropParameters" (
    "id" SERIAL NOT NULL,
    "cropName" TEXT NOT NULL,
    "baseTemperature" DOUBLE PRECISION NOT NULL,
    "totalGDD" DOUBLE PRECISION NOT NULL,
    "moistureMin" DOUBLE PRECISION NOT NULL,
    "moistureOptimal" DOUBLE PRECISION NOT NULL,
    "moistureMax" DOUBLE PRECISION NOT NULL,
    "validForUP" BOOLEAN NOT NULL DEFAULT true,
    "season" TEXT NOT NULL,
    "soilTexturePreference" TEXT NOT NULL,
    "initialStageEnd" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "developmentStageEnd" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "midSeasonEnd" DOUBLE PRECISION NOT NULL DEFAULT 75,
    "lateSeasonEnd" DOUBLE PRECISION NOT NULL DEFAULT 95,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CropParameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IrrigationLog" (
    "id" SERIAL NOT NULL,
    "nodeId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentVWC" DOUBLE PRECISION NOT NULL,
    "targetVWC" DOUBLE PRECISION NOT NULL,
    "cropType" TEXT,
    "growthStage" TEXT,
    "shouldIrrigate" BOOLEAN NOT NULL,
    "urgency" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "estimatedWaterNeeded" DOUBLE PRECISION NOT NULL,
    "actionTaken" BOOLEAN NOT NULL DEFAULT false,
    "actionTimestamp" TIMESTAMP(3),
    "actualWaterApplied" DOUBLE PRECISION,

    CONSTRAINT "IrrigationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GDDHistory_nodeId_idx" ON "GDDHistory"("nodeId");

-- CreateIndex
CREATE INDEX "GDDHistory_date_idx" ON "GDDHistory"("date");

-- CreateIndex
CREATE INDEX "GDDHistory_nodeId_date_idx" ON "GDDHistory"("nodeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "GDDHistory_nodeId_date_key" ON "GDDHistory"("nodeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "FieldConfig_nodeId_key" ON "FieldConfig"("nodeId");

-- CreateIndex
CREATE INDEX "FieldConfig_nodeId_idx" ON "FieldConfig"("nodeId");

-- CreateIndex
CREATE INDEX "FieldConfig_cropType_idx" ON "FieldConfig"("cropType");

-- CreateIndex
CREATE UNIQUE INDEX "CropParameters_cropName_key" ON "CropParameters"("cropName");

-- CreateIndex
CREATE INDEX "CropParameters_cropName_idx" ON "CropParameters"("cropName");

-- CreateIndex
CREATE INDEX "CropParameters_validForUP_idx" ON "CropParameters"("validForUP");

-- CreateIndex
CREATE INDEX "CropParameters_season_idx" ON "CropParameters"("season");

-- CreateIndex
CREATE INDEX "IrrigationLog_nodeId_timestamp_idx" ON "IrrigationLog"("nodeId", "timestamp");

-- CreateIndex
CREATE INDEX "IrrigationLog_shouldIrrigate_idx" ON "IrrigationLog"("shouldIrrigate");

-- CreateIndex
CREATE INDEX "fields_linkedNodeId_idx" ON "fields"("linkedNodeId");
