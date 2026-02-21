import { prisma } from '../config/database.js';
async function seedSensorData() {
    const reading = await prisma.sensorReading.create({
        data: {
            nodeId: 1,
            moisture: 285,
            temperature: 225, // 22.5°C * 10
            soilMoistureVWC: 28.5,
            soilTemperature: 22.5,
            airTemperature: 28.3,
            airHumidity: 65.2,
            airPressure: 1013.25,
            timestamp: new Date(),
        },
    });
    console.log('Sensor reading created:', reading.id);
}
seedSensorData()
    .then(() => process.exit(0))
    .catch((e) => {
    console.error(e);
    process.exit(1);
});
//# sourceMappingURL=seed-sensor-data.js.map