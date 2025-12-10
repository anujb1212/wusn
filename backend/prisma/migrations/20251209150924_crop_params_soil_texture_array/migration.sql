/*
  Warnings:

  - The `soilTexturePreference` column on the `CropParameters` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropIndex
DROP INDEX "CropParameters_cropName_idx";

-- DropIndex
DROP INDEX "CropParameters_season_idx";

-- DropIndex
DROP INDEX "CropParameters_validForUP_idx";

-- AlterTable
ALTER TABLE "CropParameters" DROP COLUMN "soilTexturePreference",
ADD COLUMN     "soilTexturePreference" TEXT[];
