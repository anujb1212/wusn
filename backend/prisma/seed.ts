
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding UP-valid crop');

    const crops = [
        // ====================================================================
        // RABI SEASON (Nov-Mar) - 5 crops
        // ====================================================================
        {
            cropName: 'wheat',
            baseTemperature: 5,
            totalGDD: 1800,
            moistureMin: 20,
            moistureOptimal: 27,
            moistureMax: 35,
            validForUP: true,
            season: 'RABI',
            soilTexturePreference: ['LOAM', 'CLAY_LOAM', 'SANDY_LOAM'],
            initialStageEnd: 15,
            developmentStageEnd: 35,
            midSeasonEnd: 70,
            lateSeasonEnd: 95,
        },
        {
            cropName: 'chickpea',
            baseTemperature: 10,
            totalGDD: 1500,
            moistureMin: 18,
            moistureOptimal: 24,
            moistureMax: 30,
            validForUP: true,
            season: 'RABI',
            soilTexturePreference: ['LOAM', 'CLAY_LOAM', 'SANDY_LOAM'],
            initialStageEnd: 15,
            developmentStageEnd: 35,
            midSeasonEnd: 70,
            lateSeasonEnd: 95,
        },
        {
            cropName: 'lentil',
            baseTemperature: 5,
            totalGDD: 1300,
            moistureMin: 18,
            moistureOptimal: 23,
            moistureMax: 28,
            validForUP: true,
            season: 'RABI',
            soilTexturePreference: ['LOAM', 'SANDY_LOAM'],
            initialStageEnd: 15,
            developmentStageEnd: 35,
            midSeasonEnd: 65,
            lateSeasonEnd: 90,
        },
        {
            cropName: 'pea',
            baseTemperature: 5,
            totalGDD: 1200,
            moistureMin: 18,
            moistureOptimal: 25,
            moistureMax: 32,
            validForUP: true,
            season: 'RABI',
            soilTexturePreference: ['LOAM', 'CLAY_LOAM'],
            initialStageEnd: 15,
            developmentStageEnd: 30,
            midSeasonEnd: 60,
            lateSeasonEnd: 85,
        },
        {
            cropName: 'mustard',
            baseTemperature: 5,
            totalGDD: 1400,
            moistureMin: 18,
            moistureOptimal: 25,
            moistureMax: 32,
            validForUP: true,
            season: 'RABI',
            soilTexturePreference: ['LOAM', 'CLAY_LOAM', 'SANDY_LOAM'],
            initialStageEnd: 15,
            developmentStageEnd: 30,
            midSeasonEnd: 65,
            lateSeasonEnd: 90,
        },

        // ====================================================================
        // KHARIF SEASON (Jun-Oct) - 2 crops
        // ====================================================================
        {
            cropName: 'rice',
            baseTemperature: 10,
            totalGDD: 2000,
            moistureMin: 35,
            moistureOptimal: 40,
            moistureMax: 45,
            validForUP: true,
            season: 'KHARIF',
            soilTexturePreference: ['CLAY_LOAM', 'CLAY', 'LOAM'],
            initialStageEnd: 12,
            developmentStageEnd: 30,
            midSeasonEnd: 65,
            lateSeasonEnd: 90,
        },
        {
            cropName: 'maize',
            baseTemperature: 10,
            totalGDD: 1600,
            moistureMin: 22,
            moistureOptimal: 28,
            moistureMax: 35,
            validForUP: true,
            season: 'KHARIF',
            soilTexturePreference: ['LOAM', 'SANDY_LOAM', 'CLAY_LOAM'],
            initialStageEnd: 10,
            developmentStageEnd: 30,
            midSeasonEnd: 65,
            lateSeasonEnd: 90,
        },

        // ====================================================================
        // PERENNIAL / CASH CROPS - 2 crops
        // ====================================================================
        {
            cropName: 'sugarcane',
            baseTemperature: 12,
            totalGDD: 4000,
            moistureMin: 35,
            moistureOptimal: 42,
            moistureMax: 50,
            validForUP: true,
            season: 'PERENNIAL',
            soilTexturePreference: ['LOAM', 'CLAY_LOAM'],
            initialStageEnd: 20,
            developmentStageEnd: 60,
            midSeasonEnd: 180,
            lateSeasonEnd: 240,
        },
        {
            cropName: 'potato',
            baseTemperature: 7,
            totalGDD: 1400,
            moistureMin: 20,
            moistureOptimal: 28,
            moistureMax: 36,
            validForUP: true,
            season: 'RABI',
            soilTexturePreference: ['SANDY_LOAM', 'LOAM'],
            initialStageEnd: 12,
            developmentStageEnd: 30,
            midSeasonEnd: 65,
            lateSeasonEnd: 90,
        },
    ];

    console.log('\n📊 Seeding crops...\n');

    for (const crop of crops) {
        await prisma.cropParameters.upsert({
            where: { cropName: crop.cropName },
            create: crop,
            update: crop,
        });
        console.log(`   ✅ ${crop.cropName} (${crop.season})`);
    }

    console.log('\n📊 Summary:');
    console.log(`   Total UP-valid crops: ${crops.length}`);
    console.log(`   RABI: ${crops.filter((c) => c.season === 'RABI').length}`);
    console.log(`   KHARIF: ${crops.filter((c) => c.season === 'KHARIF').length}`);
    console.log(`   PERENNIAL: ${crops.filter((c) => c.season === 'PERENNIAL').length}`);
    console.log('\n✅ Seed completed successfully!\n');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
