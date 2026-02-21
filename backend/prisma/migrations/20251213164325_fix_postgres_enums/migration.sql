-- Ensure Prisma enums exist in Postgres (Neon)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'Season'
  ) THEN
    CREATE TYPE "public"."Season" AS ENUM ('RABI', 'KHARIF', 'ZAID', 'PERENNIAL');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'SoilTexture'
  ) THEN
    CREATE TYPE "public"."SoilTexture" AS ENUM ('SANDY', 'SANDY_LOAM', 'LOAM', 'CLAY_LOAM', 'CLAY');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'GrowthStage'
  ) THEN
    CREATE TYPE "public"."GrowthStage" AS ENUM ('INITIAL', 'DEVELOPMENT', 'MID_SEASON', 'LATE_SEASON', 'HARVEST_READY');
  END IF;
END $$;

-- If any column was created as TEXT (or another type) in older migrations, coerce it to the enum.
-- These blocks are safe: they only run if the column isn't already using the enum UDT.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'CropParameters'
      AND column_name = 'season'
      AND udt_name <> 'Season'
  ) THEN
    ALTER TABLE "public"."CropParameters"
      ALTER COLUMN "season"
      TYPE "public"."Season"
      USING "season"::text::"public"."Season";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'fields'
      AND column_name = 'currentGrowthStage'
      AND udt_name <> 'GrowthStage'
  ) THEN
    ALTER TABLE "public"."fields"
      ALTER COLUMN "currentGrowthStage"
      TYPE "public"."GrowthStage"
      USING "currentGrowthStage"::text::"public"."GrowthStage";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'GDDRecord'
      AND column_name = 'growthStage'
      AND udt_name <> 'GrowthStage'
  ) THEN
    ALTER TABLE "public"."GDDRecord"
      ALTER COLUMN "growthStage"
      TYPE "public"."GrowthStage"
      USING "growthStage"::text::"public"."GrowthStage";
  END IF;
END $$;
