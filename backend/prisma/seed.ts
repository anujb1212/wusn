import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding UP-valid crops from Kaggle dataset...');

    const crops = [
        // ====================================================================
        // RABI SEASON (2 crops)
        // ====================================================================
        {
            cropName: 'lentil',
            baseTemperature: 5,
            totalGDD: 1800,
            moistureMin: 25,
            moistureOptimal: 35,
            moistureMax: 45,
            validForUP: true,
            season: 'RABI',
            soilTexturePreference: 'SANDY_LOAM',
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'lentil', //change the crop name 
            baseTemperature: 5,
            totalGDD: 1930,
            moistureMin: 25,
            moistureOptimal: 35,
            moistureMax: 45,
            validForUP: true,
            season: 'RABI',
            soilTexturePreference: 'SANDY_LOAM',
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },


        // ====================================================================
        // KHARIF SEASON (8 crops)
        // ====================================================================

        {
            cropName: 'rice',
            baseTemperature: 10,
            totalGDD: 2800,
            moistureMin: 60,
            moistureOptimal: 70,
            moistureMax: 80,
            validForUP: true,
            season: 'KHARIF',
            soilTexturePreference: 'CLAY_LOAM',
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'maize',
            baseTemperature: 8,
            totalGDD: 2000,
            moistureMin: 40,
            moistureOptimal: 50,
            moistureMax: 60,
            validForUP: true,
            season: 'KHARIF',
            soilTexturePreference: 'LOAM',
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'cotton',
            baseTemperature: 12,
            totalGDD: 2500,
            moistureMin: 35,
            moistureOptimal: 45,
            moistureMax: 55,
            validForUP: true,
            season: 'KHARIF',
            soilTexturePreference: 'SANDY_LOAM',
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'pigeonpeas',
            baseTemperature: 10,
            totalGDD: 2300,
            moistureMin: 30,
            moistureOptimal: 40,
            moistureMax: 50,
            validForUP: true,
            season: 'KHARIF',
            soilTexturePreference: 'SANDY_LOAM',
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'mothbeans',
            baseTemperature: 10,
            totalGDD: 1600,
            moistureMin: 20,
            moistureOptimal: 30,
            moistureMax: 40,
            validForUP: true,
            season: 'KHARIF',
            soilTexturePreference: 'SANDY',
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'mungbean',
            baseTemperature: 10,
            totalGDD: 1400,
            moistureMin: 30,
            moistureOptimal: 40,
            moistureMax: 50,
            validForUP: true,
            season: 'KHARIF',
            soilTexturePreference: 'SANDY_LOAM',
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'blackgram',
            baseTemperature: 10,
            totalGDD: 1300,
            moistureMin: 30,
            moistureOptimal: 40,
            moistureMax: 50,
            validForUP: true,
            season: 'KHARIF',
            soilTexturePreference: 'SANDY_LOAM',
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'kidneybeans',
            baseTemperature: 8,
            totalGDD: 1700,
            moistureMin: 35,
            moistureOptimal: 45,
            moistureMax: 55,
            validForUP: true,
            season: 'KHARIF',
            soilTexturePreference: 'LOAM',
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        // ====================================================================
        // ZAID SEASON (2 crops)
        // ====================================================================

        {
            cropName: 'watermelon',
            baseTemperature: 15,
            totalGDD: 1500,
            moistureMin: 40,
            moistureOptimal: 50,
            moistureMax: 60,
            validForUP: true,
            season: 'ZAID',
            soilTexturePreference: 'SANDY_LOAM',
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'muskmelon',
            baseTemperature: 15,
            totalGDD: 1400,
            moistureMin: 40,
            moistureOptimal: 50,
            moistureMax: 60,
            validForUP: true,
            season: 'ZAID',
            soilTexturePreference: 'SANDY_LOAM',
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        // ====================================================================
        // NON-UP CROPS (marked as invalid - from CSV but not suitable for UP)
        // ====================================================================

        {
            cropName: 'pomegranate',
            baseTemperature: 12,
            totalGDD: 2400,
            moistureMin: 35,
            moistureOptimal: 45,
            moistureMax: 55,
            validForUP: false,
            season: 'PERENNIAL',
            soilTexturePreference: 'SANDY_LOAM',
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'banana',
            baseTemperature: 14,
            totalGDD: 2800,
            moistureMin: 55,
            moistureOptimal: 65,
            moistureMax: 75,
            validForUP: false,
            season: 'PERENNIAL',
            soilTexturePreference: 'LOAM',
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'mango',
            baseTemperature: 15,
            totalGDD: 3200,
            moistureMin: 40,
            moistureOptimal: 50,
            moistureMax: 60,
            validForUP: false,
            season: 'PERENNIAL',
            soilTexturePreference: 'SANDY_LOAM',
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'grapes',
            baseTemperature: 10,
            totalGDD: 2200,
            moistureMin: 30,
            moistureOptimal: 40,
            moistureMax: 50,
            validForUP: false,
            season: 'PERENNIAL',
            soilTexturePreference: 'SANDY_LOAM',
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'apple',
            baseTemperature: 5,
            totalGDD: 2000,
            moistureMin: 35,
            moistureOptimal: 45,
            moistureMax: 55,
            validForUP: false,
            season: 'PERENNIAL',
            soilTexturePreference: 'LOAM',
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'orange',
            baseTemperature: 13,
            totalGDD: 2600,
            moistureMin: 40,
            moistureOptimal: 50,
            moistureMax: 60,
            validForUP: false,
            season: 'PERENNIAL',
            soilTexturePreference: 'SANDY_LOAM',
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'papaya',
            baseTemperature: 15,
            totalGDD: 2600,
            moistureMin: 50,
            moistureOptimal: 60,
            moistureMax: 70,
            validForUP: false,
            season: 'PERENNIAL',
            soilTexturePreference: 'LOAM',
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'coconut',
            baseTemperature: 15,
            totalGDD: 3000,
            moistureMin: 50,
            moistureOptimal: 60,
            moistureMax: 70,
            validForUP: false,
            season: 'PERENNIAL',
            soilTexturePreference: 'SANDY_LOAM',
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'jute',
            baseTemperature: 12,
            totalGDD: 2200,
            moistureMin: 55,
            moistureOptimal: 65,
            moistureMax: 75,
            validForUP: false,
            season: 'KHARIF',
            soilTexturePreference: 'CLAY_LOAM',
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },

        {
            cropName: 'coffee',
            baseTemperature: 12,
            totalGDD: 2500,
            moistureMin: 45,
            moistureOptimal: 55,
            moistureMax: 65,
            validForUP: false,
            season: 'PERENNIAL',
            soilTexturePreference: 'LOAM',
            initialStageEnd: 15,
            developmentStageEnd: 40,
            midSeasonEnd: 75,
            lateSeasonEnd: 95,
        },
    ];

    for (const crop of crops) {
        await prisma.cropParameters.upsert({
            where: { cropName: crop.cropName },
            update: crop,
            create: crop,
        });
        console.log(`✅ ${crop.cropName} (UP valid: ${crop.validForUP})`);
    }

    console.log('\n📊 Summary:');
    console.log(`   Total crops: ${crops.length}`);
    console.log(`   UP-valid: ${crops.filter(c => c.validForUP).length}`);
    console.log(`   Rabi: 2, Kharif: 8, Zaid: 2`);
    console.log('\n✅ Seed completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
