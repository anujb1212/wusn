/**
 * Weather Data Repository
 */
import { prisma } from '../config/database.js';
import { DatabaseError } from '../utils/errors.js';
/**
 * Create weather reading from gateway sensor
 */
export async function createWeatherReading(input) {
    try {
        return await prisma.weatherReading.create({
            data: {
                gatewayId: input.gatewayId,
                airTemperature: input.airTemperature,
                humidity: input.humidity,
                pressure: input.pressure ?? null,
                timestamp: input.timestamp,
            },
        });
    }
    catch (error) {
        throw new DatabaseError('createWeatherReading', error);
    }
}
/**
 * Get latest weather reading for gateway
 */
export async function getLatestWeatherReading(gatewayId) {
    try {
        return await prisma.weatherReading.findFirst({
            where: { gatewayId },
            orderBy: { timestamp: 'desc' },
        });
    }
    catch (error) {
        throw new DatabaseError('getLatestWeatherReading', error);
    }
}
/**
 * Get weather readings for date range
 */
export async function getWeatherReadingsForDateRange(gatewayId, startDate, endDate) {
    try {
        return await prisma.weatherReading.findMany({
            where: {
                gatewayId,
                timestamp: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { timestamp: 'asc' },
        });
    }
    catch (error) {
        throw new DatabaseError('getWeatherReadingsForDateRange', error);
    }
}
/**
 * Get daily average air temperature
 */
export async function getDailyAverageAirTemp(gatewayId, date) {
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const readings = await prisma.weatherReading.findMany({
            where: {
                gatewayId,
                timestamp: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            select: {
                airTemperature: true,
            },
        });
        if (readings.length === 0) {
            return null;
        }
        const sum = readings.reduce((acc, r) => acc + r.airTemperature, 0);
        const avg = sum / readings.length;
        const temps = readings.map(r => r.airTemperature);
        const min = Math.min(...temps);
        const max = Math.max(...temps);
        return {
            avgAirTemp: Number(avg.toFixed(2)),
            minAirTemp: Number(min.toFixed(2)),
            maxAirTemp: Number(max.toFixed(2)),
            readingsCount: readings.length,
        };
    }
    catch (error) {
        throw new DatabaseError('getDailyAverageAirTemp', error);
    }
}
/**
 * Cache weather forecast
 */
export async function cacheWeatherForecast(latitude, longitude, forecastData, ttlHours) {
    try {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
        // Delete old forecasts for this location
        await prisma.weatherForecast.deleteMany({
            where: {
                latitude,
                longitude,
            },
        });
        return await prisma.weatherForecast.create({
            data: {
                latitude,
                longitude,
                forecastData: forecastData,
                fetchedAt: now,
                expiresAt,
            },
        });
    }
    catch (error) {
        throw new DatabaseError('cacheWeatherForecast', error);
    }
}
/**
 * Get cached weather forecast
 */
export async function getCachedWeatherForecast(latitude, longitude) {
    try {
        const now = new Date();
        return await prisma.weatherForecast.findFirst({
            where: {
                latitude,
                longitude,
                expiresAt: {
                    gt: now,
                },
            },
            orderBy: {
                fetchedAt: 'desc',
            },
        });
    }
    catch (error) {
        throw new DatabaseError('getCachedWeatherForecast', error);
    }
}
/**
 * Clean expired weather forecasts
 */
export async function cleanExpiredForecasts() {
    try {
        const now = new Date();
        const result = await prisma.weatherForecast.deleteMany({
            where: {
                expiresAt: {
                    lt: now,
                },
            },
        });
        return result.count;
    }
    catch (error) {
        throw new DatabaseError('cleanExpiredForecasts', error);
    }
}
//# sourceMappingURL=weather.repository.js.map