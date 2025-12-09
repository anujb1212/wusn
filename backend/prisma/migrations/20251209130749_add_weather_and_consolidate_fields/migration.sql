/*
  Warnings:

  - You are about to drop the column `linkedNodeId` on the `fields` table. All the data in the column will be lost.
  - You are about to drop the column `recommendedCrop` on the `fields` table. All the data in the column will be lost.
  - You are about to drop the column `selectedCrop` on the `fields` table. All the data in the column will be lost.
  - You are about to drop the column `soilType` on the `fields` table. All the data in the column will be lost.
  - You are about to drop the `FieldConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GDDHistory` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[nodeId]` on the table `fields` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `gatewayId` to the `fields` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nodeId` to the `fields` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."fields_linkedNodeId_idx";

-- AlterTable
ALTER TABLE "fields" DROP COLUMN "linkedNodeId",
DROP COLUMN "recommendedCrop",
DROP COLUMN "selectedCrop",
DROP COLUMN "soilType",
ADD COLUMN     "baseTemperature" DOUBLE PRECISION,
ADD COLUMN     "cropType" TEXT,
ADD COLUMN     "expectedGDDTotal" DOUBLE PRECISION,
ADD COLUMN     "expectedHarvestDate" TIMESTAMP(3),
ADD COLUMN     "gatewayId" TEXT NOT NULL,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "nodeId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."FieldConfig";

-- DropTable
DROP TABLE "public"."GDDHistory";

-- CreateTable
CREATE TABLE "WeatherReading" (
    "id" SERIAL NOT NULL,
    "gatewayId" TEXT NOT NULL,
    "airTemperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "pressure" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherForecast" (
    "id" SERIAL NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "forecastData" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeatherForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GDDRecord" (
    "id" SERIAL NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "avgAirTemp" DOUBLE PRECISION NOT NULL,
    "minAirTemp" DOUBLE PRECISION,
    "maxAirTemp" DOUBLE PRECISION,
    "readingsCount" INTEGER NOT NULL,
    "dailyGDD" DOUBLE PRECISION NOT NULL,
    "cumulativeGDD" DOUBLE PRECISION NOT NULL,
    "cropType" TEXT,
    "baseTemperature" DOUBLE PRECISION NOT NULL,
    "growthStage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GDDRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeatherReading_gatewayId_timestamp_idx" ON "WeatherReading"("gatewayId", "timestamp");

-- CreateIndex
CREATE INDEX "WeatherReading_timestamp_idx" ON "WeatherReading"("timestamp");

-- CreateIndex
CREATE INDEX "WeatherForecast_latitude_longitude_expiresAt_idx" ON "WeatherForecast"("latitude", "longitude", "expiresAt");

-- CreateIndex
CREATE INDEX "GDDRecord_fieldId_idx" ON "GDDRecord"("fieldId");

-- CreateIndex
CREATE INDEX "GDDRecord_date_idx" ON "GDDRecord"("date");

-- CreateIndex
CREATE INDEX "GDDRecord_fieldId_date_idx" ON "GDDRecord"("fieldId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "GDDRecord_fieldId_date_key" ON "GDDRecord"("fieldId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "fields_nodeId_key" ON "fields"("nodeId");

-- CreateIndex
CREATE INDEX "fields_nodeId_idx" ON "fields"("nodeId");

-- CreateIndex
CREATE INDEX "fields_gatewayId_idx" ON "fields"("gatewayId");

-- CreateIndex
CREATE INDEX "fields_cropType_idx" ON "fields"("cropType");

-- AddForeignKey
ALTER TABLE "GDDRecord" ADD CONSTRAINT "GDDRecord_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;
