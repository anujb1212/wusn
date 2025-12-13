import { PrismaClient, SoilTexture } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    await prisma.node.upsert({
        where: { nodeId: 1 },
        update: {},
        create: {
            nodeId: 1,
            location: 'Test Plot',
            burialDepth: 30,
            distanceToGW: 3.5,
            isActive: true,
        },
    });

    await prisma.field.upsert({
        where: { nodeId: 1 },
        update: {},
        create: {
            nodeId: 1,
            gatewayId: 'gw-1',
            fieldName: 'Field 1',
            location: 'Lucknow',
            latitude: 26.8467,
            longitude: 80.9462,
            soilTexture: SoilTexture.SANDY_LOAM,
            cropConfirmed: false,
        },
    });

    await prisma.sensorReading.create({
        data: {
            nodeId: 1,
            moisture: 512,
            temperature: 300,
            soilMoistureVWC: 28.5,
            soilTemperature: 18.0,
            airTemperature: 22.5,
            airHumidity: 60.0,
            airPressure: 1013.0,
            timestamp: new Date(),
        },
    });

    console.log('✅ Dev fixtures inserted (nodeId=1)');
}

main()
    .catch((e) => {
        console.error(e);
        throw e
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
