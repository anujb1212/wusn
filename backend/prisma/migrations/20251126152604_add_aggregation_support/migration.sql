-- DropForeignKey
ALTER TABLE "public"."CropRecommendation" DROP CONSTRAINT "CropRecommendation_analysisId_fkey";

-- AlterTable
ALTER TABLE "CropRecommendation" ADD COLUMN     "aggregatedAnalysisId" INTEGER,
ALTER COLUMN "analysisId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Node" ADD COLUMN     "distanceToGW" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "SensorReading" ADD COLUMN     "batteryLevel" INTEGER;

-- CreateTable
CREATE TABLE "AggregatedReading" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "selectedNodeId" INTEGER NOT NULL,
    "allNodesData" JSONB NOT NULL,
    "selectionScore" DOUBLE PRECISION NOT NULL,
    "selectionReason" TEXT NOT NULL,

    CONSTRAINT "AggregatedReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AggregatedAnalysis" (
    "id" SERIAL NOT NULL,
    "aggregatedReadingId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fuzzyDryScore" INTEGER NOT NULL,
    "fuzzyOptimalScore" INTEGER NOT NULL,
    "fuzzyWetScore" INTEGER NOT NULL,
    "soilStatus" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "irrigationAdvice" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,

    CONSTRAINT "AggregatedAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AggregatedReading_timestamp_idx" ON "AggregatedReading"("timestamp");

-- CreateIndex
CREATE INDEX "AggregatedReading_selectedNodeId_idx" ON "AggregatedReading"("selectedNodeId");

-- CreateIndex
CREATE UNIQUE INDEX "AggregatedAnalysis_aggregatedReadingId_key" ON "AggregatedAnalysis"("aggregatedReadingId");

-- CreateIndex
CREATE INDEX "AggregatedAnalysis_aggregatedReadingId_idx" ON "AggregatedAnalysis"("aggregatedReadingId");

-- CreateIndex
CREATE INDEX "CropRecommendation_aggregatedAnalysisId_idx" ON "CropRecommendation"("aggregatedAnalysisId");

-- AddForeignKey
ALTER TABLE "AggregatedAnalysis" ADD CONSTRAINT "AggregatedAnalysis_aggregatedReadingId_fkey" FOREIGN KEY ("aggregatedReadingId") REFERENCES "AggregatedReading"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropRecommendation" ADD CONSTRAINT "CropRecommendation_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CropRecommendation" ADD CONSTRAINT "CropRecommendation_aggregatedAnalysisId_fkey" FOREIGN KEY ("aggregatedAnalysisId") REFERENCES "AggregatedAnalysis"("id") ON DELETE SET NULL ON UPDATE CASCADE;
