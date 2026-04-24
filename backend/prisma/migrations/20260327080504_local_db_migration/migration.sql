/*
  Warnings:

  - The `soilTexturePreference` column on the `CropParameters` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `soilTexture` column on the `fields` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "CropParameters" DROP COLUMN "soilTexturePreference",
ADD COLUMN     "soilTexturePreference" "SoilTexture"[];

-- AlterTable
ALTER TABLE "fields" DROP COLUMN "soilTexture",
ADD COLUMN     "soilTexture" "SoilTexture" NOT NULL DEFAULT 'SANDY_LOAM';

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("nodeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_cropType_fkey" FOREIGN KEY ("cropType") REFERENCES "CropParameters"("cropName") ON DELETE SET NULL ON UPDATE CASCADE;
