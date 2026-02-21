-- Step 1: Add new columns as OPTIONAL first (with DEFAULT values)
ALTER TABLE "CropParameters" ADD COLUMN "soilTempMin" DOUBLE PRECISION;
ALTER TABLE "CropParameters" ADD COLUMN "soilTempOptimal" DOUBLE PRECISION;
ALTER TABLE "CropParameters" ADD COLUMN "soilTempMax" DOUBLE PRECISION;
ALTER TABLE "CropParameters" ADD COLUMN "vwcMin" DOUBLE PRECISION;
ALTER TABLE "CropParameters" ADD COLUMN "vwcOptimal" DOUBLE PRECISION;
ALTER TABLE "CropParameters" ADD COLUMN "vwcMax" DOUBLE PRECISION;
ALTER TABLE "CropParameters" ADD COLUMN "rootDepthCm" INTEGER;
ALTER TABLE "CropParameters" ADD COLUMN "mad" DOUBLE PRECISION;
ALTER TABLE "CropParameters" ADD COLUMN "kc" JSONB;
ALTER TABLE "CropParameters" ADD COLUMN "initialStageGDD" DOUBLE PRECISION;
ALTER TABLE "CropParameters" ADD COLUMN "developmentStageGDD" DOUBLE PRECISION;
ALTER TABLE "CropParameters" ADD COLUMN "midSeasonGDD" DOUBLE PRECISION;
ALTER TABLE "CropParameters" ADD COLUMN "lateSeasonGDD" DOUBLE PRECISION;

-- Step 2: Delete any existing crop data (we'll re-seed with complete data)
DELETE FROM "CropParameters";

-- Step 3: Make all new columns NOT NULL now that table is empty
ALTER TABLE "CropParameters" ALTER COLUMN "soilTempMin" SET NOT NULL;
ALTER TABLE "CropParameters" ALTER COLUMN "soilTempOptimal" SET NOT NULL;
ALTER TABLE "CropParameters" ALTER COLUMN "soilTempMax" SET NOT NULL;
ALTER TABLE "CropParameters" ALTER COLUMN "vwcMin" SET NOT NULL;
ALTER TABLE "CropParameters" ALTER COLUMN "vwcOptimal" SET NOT NULL;
ALTER TABLE "CropParameters" ALTER COLUMN "vwcMax" SET NOT NULL;
ALTER TABLE "CropParameters" ALTER COLUMN "rootDepthCm" SET NOT NULL;
ALTER TABLE "CropParameters" ALTER COLUMN "mad" SET NOT NULL;
ALTER TABLE "CropParameters" ALTER COLUMN "kc" SET NOT NULL;
ALTER TABLE "CropParameters" ALTER COLUMN "initialStageGDD" SET NOT NULL;
ALTER TABLE "CropParameters" ALTER COLUMN "developmentStageGDD" SET NOT NULL;
ALTER TABLE "CropParameters" ALTER COLUMN "midSeasonGDD" SET NOT NULL;
ALTER TABLE "CropParameters" ALTER COLUMN "lateSeasonGDD" SET NOT NULL;

-- Step 4: Remove old fields that are no longer needed
ALTER TABLE "CropParameters" DROP COLUMN "moistureMin";
ALTER TABLE "CropParameters" DROP COLUMN "moistureOptimal";
ALTER TABLE "CropParameters" DROP COLUMN "moistureMax";
ALTER TABLE "CropParameters" DROP COLUMN "initialStageEnd";
ALTER TABLE "CropParameters" DROP COLUMN "developmentStageEnd";
ALTER TABLE "CropParameters" DROP COLUMN "midSeasonEnd";
ALTER TABLE "CropParameters" DROP COLUMN "lateSeasonEnd";

