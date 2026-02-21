/*
  Warnings:

  - You are about to drop the column `batteryLevel` on the `SensorReading` table. All the data in the column will be lost.
  - You are about to drop the column `rssi` on the `SensorReading` table. All the data in the column will be lost.
  - Made the column `soilMoistureVWC` on table `SensorReading` required. This step will fail if there are existing NULL values in that column.
  - Made the column `soilTemperature` on table `SensorReading` required. This step will fail if there are existing NULL values in that column.
  - Made the column `airHumidity` on table `SensorReading` required. This step will fail if there are existing NULL values in that column.
  - Made the column `airTemperature` on table `SensorReading` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "SensorReading" DROP COLUMN "batteryLevel",
DROP COLUMN "rssi",
ALTER COLUMN "soilMoistureVWC" SET NOT NULL,
ALTER COLUMN "soilTemperature" SET NOT NULL,
ALTER COLUMN "airHumidity" SET NOT NULL,
ALTER COLUMN "airTemperature" SET NOT NULL;
