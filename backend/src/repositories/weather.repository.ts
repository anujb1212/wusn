/**
 * Weather Data Repository
 * 
 * Handles air temperature data aggregation from SensorReading.airTemperature
 * (gateway-provided air measurements) and external weather forecast caching.
 * 
 * Note: WeatherReading table is deprecated - air measurements now part of SensorReading
 * 
 * UPDATED: Dec 11, 2025 - Removed problematic null filters, handle in JavaScript
 */

import { prisma } from '../config/database.js';
import { DatabaseError } from '../utils/errors.js';

/**
 * Daily air temperature aggregation result
 * Used for GDD calculations and ET estimation
 */
export interface DailyAirTempData {
    avgAirTemp: number;     // Daily average air temperature (°C)
    minAirTemp: number;     // Daily minimum air temperature (°C)
    maxAirTemp: number;     // Daily maximum air temperature (°C)
    readingsCount: number;  // Number of sensor readings used
}

/**
 * Get daily air temperature statistics from sensor readings
 * 
 * Queries SensorReading.airTemperature (from gateway BME280 or similar)
 * Aggregates all readings for specified date to compute min/max/avg
 * 
 * Used by GDD service for daily GDD calculation:
 * GDD = max(0, (Tmax + Tmin)/2 - Tbase)
 * 
 * @param gatewayId - Gateway identifier
 * @param date - Date to aggregate (time component ignored)
 * @returns DailyAirTempData or null if no readings available
 */
export async function getDailyAverageAirTemp(
    gatewayId: string,
    date: Date
): Promise<DailyAirTempData | null> {
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // First, find all nodes associated with this gateway
        const fields = await prisma.field.findMany({
            where: { gatewayId },
            select: { nodeId: true },
        });

        if (fields.length === 0) {
            return null;
        }

        const nodeIds = fields.map(f => f.nodeId);

        // Query SensorReading.airTemperature for these nodes
        const readings = await prisma.sensorReading.findMany({
            where: {
                nodeId: {
                    in: nodeIds,
                },
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

        // Filter out null/undefined values
        const temps = readings
            .map(r => r.airTemperature)
            .filter((t): t is number => t !== null && t !== undefined);

        if (temps.length === 0) {
            return null;
        }

        // Calculate statistics
        const sum = temps.reduce((acc, t) => acc + t, 0);
        const avg = sum / temps.length;
        const min = Math.min(...temps);
        const max = Math.max(...temps);

        return {
            avgAirTemp: Number(avg.toFixed(2)),
            minAirTemp: Number(min.toFixed(2)),
            maxAirTemp: Number(max.toFixed(2)),
            readingsCount: temps.length,
        };
    } catch (error) {
        throw new DatabaseError('getDailyAverageAirTemp', error as Error);
    }
}

/**
 * Get daily air temperature statistics by nodeId (alternative method)
 * 
 * Simpler query when you have nodeId directly instead of gatewayId
 * 
 * @param nodeId - Sensor node ID
 * @param date - Date to aggregate
 * @returns DailyAirTempData or null if no readings
 */
export async function getDailyAirTempByNode(
    nodeId: number,
    date: Date
): Promise<DailyAirTempData | null> {
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const readings = await prisma.sensorReading.findMany({
            where: {
                nodeId,
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

        const temps = readings
            .map(r => r.airTemperature)
            .filter((t): t is number => t !== null && t !== undefined);

        if (temps.length === 0) {
            return null;
        }

        const sum = temps.reduce((acc, t) => acc + t, 0);
        const avg = sum / temps.length;
        const min = Math.min(...temps);
        const max = Math.max(...temps);

        return {
            avgAirTemp: Number(avg.toFixed(2)),
            minAirTemp: Number(min.toFixed(2)),
            maxAirTemp: Number(max.toFixed(2)),
            readingsCount: temps.length,
        };
    } catch (error) {
        throw new DatabaseError('getDailyAirTempByNode', error as Error);
    }
}

/**
 * Get air temperature readings for date range
 * 
 * @param nodeId - Sensor node ID
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns Array of readings with timestamps and air temperatures
 */
export async function getAirTempReadingsForDateRange(
    nodeId: number,
    startDate: Date,
    endDate: Date
) {
    try {
        const readings = await prisma.sensorReading.findMany({
            where: {
                nodeId,
                timestamp: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                id: true,
                nodeId: true,
                airTemperature: true,
                airHumidity: true,
                airPressure: true,
                timestamp: true,
            },
            orderBy: { timestamp: 'asc' },
        });

        // Filter out readings without air temperature
        return readings.filter(r => r.airTemperature !== null && r.airTemperature !== undefined);
    } catch (error) {
        throw new DatabaseError('getAirTempReadingsForDateRange', error as Error);
    }
}

// ============================================================================
// EXTERNAL WEATHER FORECAST CACHING (OpenWeather API, etc.)
// ============================================================================

/**
 * Cache weather forecast from external API
 * 
 * Used for rain prediction and irrigation scheduling
 * 
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @param forecastData - Forecast data (JSON)
 * @param ttlHours - Time-to-live in hours
 * @returns Cached forecast record
 */
export async function cacheWeatherForecast(
    latitude: number,
    longitude: number,
    forecastData: unknown,
    ttlHours: number
) {
    try {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

        // Delete old forecasts for this location (keep only latest)
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
                forecastData: forecastData as any, // JSON type in Prisma
                fetchedAt: now,
                expiresAt,
            },
        });
    } catch (error) {
        throw new DatabaseError('cacheWeatherForecast', error as Error);
    }
}

/**
 * Get cached weather forecast if not expired
 * 
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @returns Cached forecast or null if expired/not found
 */
export async function getCachedWeatherForecast(latitude: number, longitude: number) {
    try {
        const now = new Date();

        return await prisma.weatherForecast.findFirst({
            where: {
                latitude,
                longitude,
                expiresAt: {
                    gt: now, // Not expired
                },
            },
            orderBy: {
                fetchedAt: 'desc',
            },
        });
    } catch (error) {
        throw new DatabaseError('getCachedWeatherForecast', error as Error);
    }
}

/**
 * Clean expired weather forecasts (maintenance job)
 * 
 * Should be run periodically (e.g., daily cron job)
 * 
 * @returns Number of deleted forecast records
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
    } catch (error) {
        throw new DatabaseError('cleanExpiredForecasts', error as Error);
    }
}

// ============================================================================
// DEPRECATED FUNCTIONS (for backward compatibility during migration)
// ============================================================================

/**
 * @deprecated Use getDailyAirTempByNode instead
 * 
 * This function queries the deprecated WeatherReading table.
 * Air temperature data is now part of SensorReading.
 * 
 * Kept for backward compatibility during migration period.
 */
export async function getLatestWeatherReading(gatewayId: string) {
    try {
        return await prisma.weatherReading.findFirst({
            where: { gatewayId },
            orderBy: { timestamp: 'desc' },
        });
    } catch (error) {
        throw new DatabaseError('getLatestWeatherReading', error as Error);
    }
}

/**
 * @deprecated Use getAirTempReadingsForDateRange instead
 * 
 * Queries deprecated WeatherReading table.
 */
export async function getWeatherReadingsForDateRange(
    gatewayId: string,
    startDate: Date,
    endDate: Date
) {
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
    } catch (error) {
        throw new DatabaseError('getWeatherReadingsForDateRange', error as Error);
    }
}
