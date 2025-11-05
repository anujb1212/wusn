/*
  Warnings:

  - You are about to drop the `SensorData` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."SensorData";

-- CreateTable
CREATE TABLE "Node" (
    "id" SERIAL NOT NULL,
    "nodeId" INTEGER NOT NULL,
    "location" TEXT,
    "burialDepth" INTEGER,
    "installDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensorReading" (
    "id" SERIAL NOT NULL,
    "nodeId" INTEGER NOT NULL,
    "moisture" INTEGER NOT NULL,
    "temperature" INTEGER NOT NULL,
    "rssi" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensorReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" SERIAL NOT NULL,
    "readingId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fuzzyDryScore" INTEGER NOT NULL,
    "fuzzyOptimalScore" INTEGER NOT NULL,
    "fuzzyWetScore" INTEGER NOT NULL,
    "soilStatus" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "irrigationAdvice" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CropRecommendation" (
    "id" SERIAL NOT NULL,
    "analysisId" INTEGER NOT NULL,
    "cropName" TEXT NOT NULL,
    "suitability" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "CropRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" SERIAL NOT NULL,
    "nodeId" INTEGER NOT NULL,
    "readingId" INTEGER NOT NULL,
    "alertType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Node_nodeId_key" ON "Node"("nodeId");

-- CreateIndex
CREATE INDEX "Node_nodeId_idx" ON "Node"("nodeId");

-- CreateIndex
CREATE INDEX "SensorReading_nodeId_timestamp_idx" ON "SensorReading"("nodeId", "timestamp");

-- CreateIndex
CREATE INDEX "SensorReading_timestamp_idx" ON "SensorReading"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Analysis_readingId_key" ON "Analysis"("readingId");

-- CreateIndex
CREATE INDEX "Analysis_readingId_idx" ON "Analysis"("readingId");

-- CreateIndex
CREATE INDEX "Analysis_timestamp_idx" ON "Analysis"("timestamp");

-- CreateIndex
CREATE INDEX "CropRecommendation_analysisId_idx" ON "CropRecommendation"("analysisId");

-- CreateIndex
CREATE INDEX "CropRecommendation_cropName_idx" ON "CropRecommendation"("cropName");

-- CreateIndex
CREATE INDEX "Alert_nodeId_sentAt_idx" ON "Alert"("nodeId", "sentAt");

-- CreateIndex
CREATE INDEX "Alert_acknowledged_idx" ON "Alert"("acknowledged");

-- AddForeignKey
ALTER TABLE "SensorReading" ADD CONSTRAINT "SensorReading_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("nodeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_readingId_fkey" FOREIGN KEY ("readingId") REFERENCES "SensorReading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropRecommendation" ADD CONSTRAINT "CropRecommendation_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
