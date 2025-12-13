// prisma/seed.ts
import { PrismaClient, Season, SoilTexture, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed Database with UP-Valid Crops (current universe: 19 crops)
 *
 * Notes:
 * - Uses Prisma enums (Season, SoilTexture) to match hardened schema types. [web:46][web:355]
 * - Runs all upserts in a single transaction to avoid partial seeds. [web:155]
 * - Optionally removes stale CropParameters rows not in this seed list.
 */
async function main() {
    if (process.env.NODE_ENV === 'production' && process.env.SEED_ALLOW_PROD !== 'true') {
        throw new Error('Refusing to run seed in production. Set SEED_ALLOW_PROD=true to override.');
    }

    console.log('Seeding UP-valid crops for precision agriculture system...\n');

    const crops: Prisma.CropParametersCreateInput[] = [
        // ====================================================================
        // FIELD CROPS / STAPLES
        // ====================================================================

        {
            cropName: 'wheat',
            soilTempMin: 10,
            soilTempOptimal: 18,
            soilTempMax: 25,
            vwcMin: 20,
            vwcOptimal: 25,
            vwcMax: 30,
            baseTemperature: 0,
            totalGDD: 1400,
            rootDepthCm: 120,
            mad: 0.55,
            kc: { ini: 0.4, mid: 1.15, end: 0.4 },
            initialStageGDD: 210,
            developmentStageGDD: 490,
            midSeasonGDD: 980,
            lateSeasonGDD: 1400,
            validForUP: true,
            season: Season.RABI,
            soilTexturePreference: [SoilTexture.LOAM, SoilTexture.CLAY_LOAM, SoilTexture.SANDY_LOAM],
        },

        {
            cropName: 'rice',
            soilTempMin: 20,
            soilTempOptimal: 25,
            soilTempMax: 35,
            vwcMin: 35,
            vwcOptimal: 40,
            vwcMax: 45,
            baseTemperature: 10,
            totalGDD: 2000,
            rootDepthCm: 50,
            mad: 0.2,
            kc: { ini: 1.05, mid: 1.2, end: 0.9 },
            initialStageGDD: 300,
            developmentStageGDD: 600,
            midSeasonGDD: 1400,
            lateSeasonGDD: 2000,
            validForUP: true,
            season: Season.KHARIF,
            soilTexturePreference: [SoilTexture.CLAY_LOAM, SoilTexture.CLAY, SoilTexture.LOAM],
        },

        {
            cropName: 'maize',
            soilTempMin: 15,
            soilTempOptimal: 22,
            soilTempMax: 30,
            vwcMin: 22,
            vwcOptimal: 28,
            vwcMax: 35,
            baseTemperature: 10,
            totalGDD: 1600,
            rootDepthCm: 100,
            mad: 0.55,
            kc: { ini: 0.3, mid: 1.2, end: 0.35 },
            initialStageGDD: 200,
            developmentStageGDD: 480,
            midSeasonGDD: 1120,
            lateSeasonGDD: 1600,
            validForUP: true,
            season: Season.KHARIF,
            soilTexturePreference: [SoilTexture.LOAM, SoilTexture.SANDY_LOAM, SoilTexture.CLAY_LOAM],
        },

        {
            cropName: 'chickpea',
            soilTempMin: 10,
            soilTempOptimal: 18,
            soilTempMax: 25,
            vwcMin: 18,
            vwcOptimal: 24,
            vwcMax: 30,
            baseTemperature: 5,
            totalGDD: 1500,
            rootDepthCm: 100,
            mad: 0.5,
            kc: { ini: 0.4, mid: 1.05, end: 0.35 },
            initialStageGDD: 225,
            developmentStageGDD: 525,
            midSeasonGDD: 1050,
            lateSeasonGDD: 1500,
            validForUP: true,
            season: Season.RABI,
            soilTexturePreference: [SoilTexture.LOAM, SoilTexture.CLAY_LOAM, SoilTexture.SANDY_LOAM],
        },

        {
            cropName: 'lentil',
            soilTempMin: 8,
            soilTempOptimal: 15,
            soilTempMax: 22,
            vwcMin: 18,
            vwcOptimal: 23,
            vwcMax: 28,
            baseTemperature: 2,
            totalGDD: 1300,
            rootDepthCm: 80,
            mad: 0.5,
            kc: { ini: 0.4, mid: 1.1, end: 0.3 },
            initialStageGDD: 195,
            developmentStageGDD: 455,
            midSeasonGDD: 910,
            lateSeasonGDD: 1300,
            validForUP: true,
            season: Season.RABI,
            soilTexturePreference: [SoilTexture.LOAM, SoilTexture.SANDY_LOAM],
        },

        {
            cropName: 'pea',
            soilTempMin: 8,
            soilTempOptimal: 15,
            soilTempMax: 22,
            vwcMin: 18,
            vwcOptimal: 25,
            vwcMax: 32,
            baseTemperature: 5,
            totalGDD: 1200,
            rootDepthCm: 70,
            mad: 0.45,
            kc: { ini: 0.5, mid: 1.15, end: 0.3 },
            initialStageGDD: 180,
            developmentStageGDD: 420,
            midSeasonGDD: 840,
            lateSeasonGDD: 1200,
            validForUP: true,
            season: Season.RABI,
            soilTexturePreference: [SoilTexture.LOAM, SoilTexture.CLAY_LOAM],
        },

        {
            cropName: 'mustard',
            soilTempMin: 10,
            soilTempOptimal: 18,
            soilTempMax: 25,
            vwcMin: 18,
            vwcOptimal: 25,
            vwcMax: 32,
            baseTemperature: 5,
            totalGDD: 1400,
            rootDepthCm: 90,
            mad: 0.5,
            kc: { ini: 0.35, mid: 1.1, end: 0.35 },
            initialStageGDD: 210,
            developmentStageGDD: 490,
            midSeasonGDD: 980,
            lateSeasonGDD: 1400,
            validForUP: true,
            season: Season.RABI,
            soilTexturePreference: [SoilTexture.LOAM, SoilTexture.CLAY_LOAM, SoilTexture.SANDY_LOAM],
        },

        {
            cropName: 'sugarcane',
            soilTempMin: 20,
            soilTempOptimal: 28,
            soilTempMax: 35,
            vwcMin: 35,
            vwcOptimal: 42,
            vwcMax: 50,
            baseTemperature: 10,
            totalGDD: 4000,
            rootDepthCm: 120,
            mad: 0.65,
            kc: { ini: 0.4, mid: 1.25, end: 0.75 },
            initialStageGDD: 600,
            developmentStageGDD: 1800,
            midSeasonGDD: 3200,
            lateSeasonGDD: 4000,
            validForUP: true,
            season: Season.PERENNIAL,
            soilTexturePreference: [SoilTexture.LOAM, SoilTexture.CLAY_LOAM],
        },

        {
            cropName: 'potato',
            soilTempMin: 10,
            soilTempOptimal: 18,
            soilTempMax: 24,
            vwcMin: 20,
            vwcOptimal: 28,
            vwcMax: 36,
            baseTemperature: 2,
            totalGDD: 1400,
            rootDepthCm: 50,
            mad: 0.35,
            kc: { ini: 0.5, mid: 1.15, end: 0.75 },
            initialStageGDD: 210,
            developmentStageGDD: 490,
            midSeasonGDD: 980,
            lateSeasonGDD: 1400,
            validForUP: true,
            season: Season.RABI,
            soilTexturePreference: [SoilTexture.SANDY_LOAM, SoilTexture.LOAM],
        },

        // ====================================================================
        // VEGETABLES / LEAFY / CUCURBITS
        // ====================================================================

        {
            cropName: 'radish',
            soilTempMin: 8,
            soilTempOptimal: 15,
            soilTempMax: 22,
            vwcMin: 18,
            vwcOptimal: 24,
            vwcMax: 32,
            baseTemperature: 4.5,
            totalGDD: 600,
            rootDepthCm: 30,
            mad: 0.4,
            kc: { ini: 0.7, mid: 0.9, end: 0.85 },
            initialStageGDD: 90,
            developmentStageGDD: 210,
            midSeasonGDD: 420,
            lateSeasonGDD: 600,
            validForUP: true,
            season: Season.RABI,
            soilTexturePreference: [SoilTexture.SANDY_LOAM, SoilTexture.LOAM],
        },

        {
            cropName: 'carrot',
            soilTempMin: 10,
            soilTempOptimal: 18,
            soilTempMax: 24,
            vwcMin: 18,
            vwcOptimal: 25,
            vwcMax: 32,
            baseTemperature: 6,
            totalGDD: 1300,
            rootDepthCm: 50,
            mad: 0.4,
            kc: { ini: 0.7, mid: 1.05, end: 0.95 },
            initialStageGDD: 195,
            developmentStageGDD: 455,
            midSeasonGDD: 910,
            lateSeasonGDD: 1300,
            validForUP: true,
            season: Season.RABI,
            soilTexturePreference: [SoilTexture.SANDY_LOAM, SoilTexture.LOAM],
        },

        {
            cropName: 'tomato',
            soilTempMin: 15,
            soilTempOptimal: 22,
            soilTempMax: 28,
            vwcMin: 20,
            vwcOptimal: 28,
            vwcMax: 36,
            baseTemperature: 7,
            totalGDD: 1900,
            rootDepthCm: 70,
            mad: 0.4,
            kc: { ini: 0.6, mid: 1.15, end: 0.7 },
            initialStageGDD: 285,
            developmentStageGDD: 665,
            midSeasonGDD: 1330,
            lateSeasonGDD: 1900,
            validForUP: true,
            season: Season.RABI,
            soilTexturePreference: [SoilTexture.LOAM, SoilTexture.SANDY_LOAM],
        },

        {
            cropName: 'spinach',
            soilTempMin: 8,
            soilTempOptimal: 15,
            soilTempMax: 22,
            vwcMin: 18,
            vwcOptimal: 26,
            vwcMax: 34,
            baseTemperature: 4,
            totalGDD: 700,
            rootDepthCm: 30,
            mad: 0.35,
            kc: { ini: 0.7, mid: 1.0, end: 0.95 },
            initialStageGDD: 105,
            developmentStageGDD: 245,
            midSeasonGDD: 490,
            lateSeasonGDD: 700,
            validForUP: true,
            season: Season.RABI,
            soilTexturePreference: [SoilTexture.LOAM, SoilTexture.SANDY_LOAM],
        },

        {
            cropName: 'mint',
            soilTempMin: 12,
            soilTempOptimal: 20,
            soilTempMax: 28,
            vwcMin: 22,
            vwcOptimal: 30,
            vwcMax: 38,
            baseTemperature: 0,
            totalGDD: 1200,
            rootDepthCm: 40,
            mad: 0.4,
            kc: { ini: 0.6, mid: 1.15, end: 1.1 },
            initialStageGDD: 180,
            developmentStageGDD: 420,
            midSeasonGDD: 840,
            lateSeasonGDD: 1200,
            validForUP: true,
            season: Season.PERENNIAL,
            soilTexturePreference: [SoilTexture.LOAM, SoilTexture.SANDY_LOAM],
        },

        {
            cropName: 'cucumber',
            soilTempMin: 18,
            soilTempOptimal: 24,
            soilTempMax: 30,
            vwcMin: 20,
            vwcOptimal: 28,
            vwcMax: 36,
            baseTemperature: 10,
            totalGDD: 1200,
            rootDepthCm: 70,
            mad: 0.5,
            kc: { ini: 0.6, mid: 1.0, end: 0.75 },
            initialStageGDD: 180,
            developmentStageGDD: 420,
            midSeasonGDD: 840,
            lateSeasonGDD: 1200,
            validForUP: true,
            season: Season.ZAID,
            soilTexturePreference: [SoilTexture.SANDY_LOAM, SoilTexture.LOAM],
        },

        {
            cropName: 'watermelon',
            soilTempMin: 18,
            soilTempOptimal: 25,
            soilTempMax: 32,
            vwcMin: 20,
            vwcOptimal: 26,
            vwcMax: 34,
            baseTemperature: 10,
            totalGDD: 1400,
            rootDepthCm: 100,
            mad: 0.4,
            kc: { ini: 0.4, mid: 1.0, end: 0.75 },
            initialStageGDD: 210,
            developmentStageGDD: 490,
            midSeasonGDD: 980,
            lateSeasonGDD: 1400,
            validForUP: true,
            season: Season.ZAID,
            soilTexturePreference: [SoilTexture.SANDY_LOAM, SoilTexture.LOAM],
        },

        {
            cropName: 'musk_melon',
            soilTempMin: 18,
            soilTempOptimal: 25,
            soilTempMax: 32,
            vwcMin: 20,
            vwcOptimal: 26,
            vwcMax: 34,
            baseTemperature: 10,
            totalGDD: 1400,
            rootDepthCm: 90,
            mad: 0.45,
            kc: { ini: 0.5, mid: 1.05, end: 0.75 },
            initialStageGDD: 210,
            developmentStageGDD: 490,
            midSeasonGDD: 980,
            lateSeasonGDD: 1400,
            validForUP: true,
            season: Season.ZAID,
            soilTexturePreference: [SoilTexture.SANDY_LOAM, SoilTexture.LOAM],
        },

        {
            cropName: 'bottle_gourd',
            soilTempMin: 18,
            soilTempOptimal: 24,
            soilTempMax: 30,
            vwcMin: 20,
            vwcOptimal: 28,
            vwcMax: 36,
            baseTemperature: 10,
            totalGDD: 1300,
            rootDepthCm: 80,
            mad: 0.45,
            kc: { ini: 0.5, mid: 1.0, end: 0.8 },
            initialStageGDD: 195,
            developmentStageGDD: 455,
            midSeasonGDD: 910,
            lateSeasonGDD: 1300,
            validForUP: true,
            season: Season.ZAID,
            soilTexturePreference: [SoilTexture.SANDY_LOAM, SoilTexture.LOAM],
        },

        {
            cropName: 'bitter_gourd',
            soilTempMin: 18,
            soilTempOptimal: 25,
            soilTempMax: 32,
            vwcMin: 20,
            vwcOptimal: 28,
            vwcMax: 36,
            baseTemperature: 10,
            totalGDD: 1400,
            rootDepthCm: 80,
            mad: 0.5,
            kc: { ini: 0.5, mid: 1.05, end: 0.9 },
            initialStageGDD: 210,
            developmentStageGDD: 490,
            midSeasonGDD: 980,
            lateSeasonGDD: 1400,
            validForUP: true,
            season: Season.ZAID,
            soilTexturePreference: [SoilTexture.SANDY_LOAM, SoilTexture.LOAM],
        },
    ];

    // Sanity checks (fast fail)
    const names = crops.map((c) => c.cropName);
    const uniqueNames = new Set(names);
    if (uniqueNames.size !== names.length) {
        throw new Error(`Duplicate cropName(s) in seed.ts: len=${names.length}, unique=${uniqueNames.size}`);
    }
    console.log(`📊 Seeding crops to database... (${crops.length} crops)\n`);

    // Optional cleanup: remove any CropParameters rows not present in this seed list
    // (prevents stale DB crops from lingering)
    await prisma.cropParameters.deleteMany({
        where: { cropName: { notIn: names } },
    });

    // Atomic seed: all-or-nothing [web:155]
    await prisma.$transaction(async (tx) => {
        for (const crop of crops) {
            const { cropName, ...updateData } = crop;

            await tx.cropParameters.upsert({
                where: { cropName },
                create: crop,
                update: updateData,
            });

            console.log(`   ✅ ${cropName.padEnd(15)} (${String(crop.season).padEnd(10)}) - ${crop.totalGDD} GDD`);
        }
    });

    const rabiCount = crops.filter((c) => c.season === Season.RABI).length;
    const kharifCount = crops.filter((c) => c.season === Season.KHARIF).length;
    const zaidCount = crops.filter((c) => c.season === Season.ZAID).length;
    const perennialCount = crops.filter((c) => c.season === Season.PERENNIAL).length;

    console.log('\n📊 Seeding Summary:');
    console.log('   ══════════════════════════════════════');
    console.log(`   Total UP-valid crops:     ${crops.length}`);
    console.log('   ──────────────────────────────────────');
    console.log(`   RABI (Nov-Mar):           ${rabiCount}`);
    console.log(`   KHARIF (Jun-Oct):         ${kharifCount}`);
    console.log(`   ZAID (Mar-Jun):           ${zaidCount}`);
    console.log(`   PERENNIAL (Year-round):   ${perennialCount}`);
    console.log('   ══════════════════════════════════════');
    console.log('\n✅ Database seed completed successfully!\n');
}

main()
    .catch((e) => {
        console.error('\n❌ Seed failed:', e);
        throw e
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
