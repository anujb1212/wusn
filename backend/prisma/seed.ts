// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding UP-valid crops with Phase 4 parameters...');

    const crops = [
        // ====================================================================
        // RABI SEASON (2 crops) - Nov-Mar
        // ====================================================================
        {
            cropName: 'chickpea',
            baseTemperature: 10,
            totalGDD: 1500,
            moistureMin: 15,
            moistureOptimal: 25,
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
            cropName: 'lentil',
            baseTemperature: 5,
            totalGDD: 1300,
            moistureMin: 14,
            moistureOptimal: 23,
            moistureMax: 33,
            validForUP: true,
            season: 'RABI',
            soilTexturePreference: ['LOAM', 'SANDY_LOAM'],
            initialStageEnd: 15,
            developmentStageEnd: 35,
            midSeasonEnd: 65,
            lateSeasonEnd: 90,
        },

        // ====================================================================
        // KHARIF SEASON (8 crops) - Jun-Oct
        // ====================================================================
        {
            cropName: 'rice',
            baseTemperature: 10,
            totalGDD: 2000,
            moistureMin: 30,
            moistureOptimal: 40,
            moistureMax: 50,
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
            moistureMin: 18,
            moistureOptimal: 28,
            moistureMax: 38,
            validForUP: true,
            season: 'KHARIF',
            soilTexturePreference: ['LOAM', 'SANDY_LOAM', 'CLAY_LOAM'],
            initialStageEnd: 10,
            developmentStageEnd: 30,
            midSeasonEnd: 65,
            lateSeasonEnd: 90,
        },

        {
            cropName: 'cotton',
            baseTemperature: 12,
            totalGDD: 2300,
            moistureMin: 16,
            moistureOptimal: 26,
            moistureMax: 36,
            validForUP: true,
            season: 'KHARIF',
            soilTexturePreference: ['LOAM', 'CLAY_LOAM', 'SANDY_LOAM'],
            initialStageEnd: 12,
            developmentStageEnd: 35,
            midSeasonEnd: 70,
            lateSeasonEnd: 92,
        },

        {
            cropName: 'pigeonpeas',
            baseTemperature: 10,
            totalGDD: 2200,
            moistureMin: 14,
            moistureOptimal: 24,
            moistureMax: 34,
            validForUP: true,
            season: 'KHARIF',
            soilTexturePreference: ['LOAM', 'SANDY_LOAM', 'CLAY_LOAM'],
            initialStageEnd: 15,
            developmentStageEnd: 35,
            midSeasonEnd: 70,
            lateSeasonEnd: 92,
        },

        {
            cropName: 'mothbeans',
            baseTemperature: 10,
            totalGDD: 1100,
            moistureMin: 12,
            moistureOptimal: 20,
            moistureMax: 30,
            validForUP: true,
            season: 'KHARIF',
            soilTexturePreference: ['SANDY', 'SANDY_LOAM', 'LOAM'],
            initialStageEnd: 15,
            developmentStageEnd: 35,
            midSeasonEnd: 65,
            lateSeasonEnd: 90,
        },

        {
            cropName: 'mungbean',
            baseTemperature: 10,
            totalGDD: 1000,
            moistureMin: 15,
            moistureOptimal: 24,
            moistureMax: 34,
            validForUP: true,
            season: 'KHARIF',
            soilTexturePreference: ['LOAM', 'SANDY_LOAM'],
            initialStageEnd: 15,
            developmentStageEnd: 30,
            midSeasonEnd: 60,
            lateSeasonEnd: 85,
        },

        {
            cropName: 'blackgram',
            baseTemperature: 10,
            totalGDD: 1050,
            moistureMin: 16,
            moistureOptimal: 25,
            moistureMax: 35,
            validForUP: true,
            season: 'KHARIF',
            soilTexturePreference: ['LOAM', 'CLAY_LOAM', 'SANDY_LOAM'],
            initialStageEnd: 15,
            developmentStageEnd: 30,
            midSeasonEnd: 60,
            lateSeasonEnd: 85,
        },

        {
            cropName: 'kidneybeans',
            baseTemperature: 10,
            totalGDD: 1200,
            moistureMin: 18,
            moistureOptimal: 27,
            moistureMax: 37,
            validForUP: true,
            season: 'KHARIF',
            soilTexturePreference: ['LOAM', 'CLAY_LOAM', 'SANDY_LOAM'],
            initialStageEnd: 15,
            developmentStageEnd: 35,
            midSeasonEnd: 65,
            lateSeasonEnd: 90,
        },

        // ====================================================================
        // ZAID SEASON (2 crops) - Mar-Jun
        // ====================================================================
        {
            cropName: 'watermelon',
            baseTemperature: 12,
            totalGDD: 1800,
            moistureMin: 20,
            moistureOptimal: 30,
            moistureMax: 40,
            validForUP: true,
            season: 'ZAID',
            soilTexturePreference: ['SANDY_LOAM', 'LOAM', 'SANDY'],
            initialStageEnd: 10,
            developmentStageEnd: 25,
            midSeasonEnd: 60,
            lateSeasonEnd: 85,
        },

        {
            cropName: 'muskmelon',
            baseTemperature: 12,
            totalGDD: 1600,
            moistureMin: 18,
            moistureOptimal: 28,
            moistureMax: 38,
            validForUP: true,
            season: 'ZAID',
            soilTexturePreference: ['SANDY_LOAM', 'LOAM', 'SANDY'],
            initialStageEnd: 10,
            developmentStageEnd: 25,
            midSeasonEnd: 60,
            lateSeasonEnd: 85,
        },

        // ====================================================================
        // NON-UP CROPS (marked as invalid - for reference only)
        // ====================================================================
        {
            cropName: 'pomegranate',
            baseTemperature: 12,
            totalGDD: 2400,
            moistureMin: 20,
            moistureOptimal: 30,
            moistureMax: 40,
            validForUP: false,
            season: 'PERENNIAL',
            soilTexturePreference: ['SANDY_LOAM'],
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'banana',
            baseTemperature: 14,
            totalGDD: 2800,
            moistureMin: 35,
            moistureOptimal: 45,
            moistureMax: 55,
            validForUP: false,
            season: 'PERENNIAL',
            soilTexturePreference: ['LOAM'],
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'mango',
            baseTemperature: 15,
            totalGDD: 3200,
            moistureMin: 25,
            moistureOptimal: 35,
            moistureMax: 45,
            validForUP: false,
            season: 'PERENNIAL',
            soilTexturePreference: ['SANDY_LOAM'],
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'grapes',
            baseTemperature: 10,
            totalGDD: 2200,
            moistureMin: 20,
            moistureOptimal: 30,
            moistureMax: 40,
            validForUP: false,
            season: 'PERENNIAL',
            soilTexturePreference: ['SANDY_LOAM'],
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'apple',
            baseTemperature: 5,
            totalGDD: 2000,
            moistureMin: 22,
            moistureOptimal: 32,
            moistureMax: 42,
            validForUP: false,
            season: 'PERENNIAL',
            soilTexturePreference: ['LOAM'],
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'orange',
            baseTemperature: 13,
            totalGDD: 2600,
            moistureMin: 25,
            moistureOptimal: 35,
            moistureMax: 45,
            validForUP: false,
            season: 'PERENNIAL',
            soilTexturePreference: ['SANDY_LOAM'],
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'papaya',
            baseTemperature: 15,
            totalGDD: 2600,
            moistureMin: 30,
            moistureOptimal: 40,
            moistureMax: 50,
            validForUP: false,
            season: 'PERENNIAL',
            soilTexturePreference: ['LOAM'],
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'coconut',
            baseTemperature: 15,
            totalGDD: 3000,
            moistureMin: 32,
            moistureOptimal: 42,
            moistureMax: 52,
            validForUP: false,
            season: 'PERENNIAL',
            soilTexturePreference: ['SANDY_LOAM'],
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'jute',
            baseTemperature: 12,
            totalGDD: 2200,
            moistureMin: 35,
            moistureOptimal: 45,
            moistureMax: 55,
            validForUP: false,
            season: 'KHARIF',
            soilTexturePreference: ['CLAY_LOAM'],
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'coffee',
            baseTemperature: 12,
            totalGDD: 2500,
            moistureMin: 28,
            moistureOptimal: 38,
            moistureMax: 48,
            validForUP: false,
            season: 'PERENNIAL',
            soilTexturePreference: ['LOAM'],
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },
    ];

    console.log('\n📊 Seeding crops...\n');

    for (const crop of crops) {
        await prisma.cropParameters.upsert({
            where: { cropName: crop.cropName },
            create: {
                cropName: crop.cropName,
                baseTemperature: crop.baseTemperature,
                totalGDD: crop.totalGDD,
                moistureMin: crop.moistureMin,
                moistureOptimal: crop.moistureOptimal,
                moistureMax: crop.moistureMax,
                validForUP: crop.validForUP,
                season: crop.season,
                soilTexturePreference: crop.soilTexturePreference,
                initialStageEnd: crop.initialStageEnd,
                developmentStageEnd: crop.developmentStageEnd,
                midSeasonEnd: crop.midSeasonEnd,
                lateSeasonEnd: crop.lateSeasonEnd,
            },
            update: {
                baseTemperature: crop.baseTemperature,
                totalGDD: crop.totalGDD,
                moistureMin: crop.moistureMin,
                moistureOptimal: crop.moistureOptimal,
                moistureMax: crop.moistureMax,
                validForUP: crop.validForUP,
                season: crop.season,
                soilTexturePreference: crop.soilTexturePreference,
                initialStageEnd: crop.initialStageEnd,
                developmentStageEnd: crop.developmentStageEnd,
                midSeasonEnd: crop.midSeasonEnd,
                lateSeasonEnd: crop.lateSeasonEnd,
            },
        });
    }


    const upCrops = crops.filter((c) => c.validForUP);

    console.log('\n📊 Summary:');
    console.log(`   Total crops seeded: ${crops.length}`);
    console.log(`   UP-valid crops: ${upCrops.length}`);
    console.log(`   RABI: ${upCrops.filter((c) => c.season === 'RABI').length}`);
    console.log(`   KHARIF: ${upCrops.filter((c) => c.season === 'KHARIF').length}`);
    console.log(`   ZAID: ${upCrops.filter((c) => c.season === 'ZAID').length}`);
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
