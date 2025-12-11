/**
 * Sensor Reading Repository
 * 
 * Handles CRUD operations for underground sensor measurements
 * Records: soil moisture (VWC), soil temperature, air temperature, air humidity
 * 
 * UPDATED: Dec 12, 2025 - Aligned with Prisma schema and service expectations
 */

import { prisma } from '../config/database.js';
import { DatabaseError } from '../utils/errors.js';

/**
 * Sensor reading input type
 */
export interface SensorReadingInput {
    nodeId: number;
    moisture: number;              // Raw SMU value (0-1023)
    temperature: number;           // Raw soil temperature value
    soilMoistureVWC: number;      // Calibrated VWC (%)
    soilTemperature: number;       // Calibrated soil temp (°C)
    airTemperature: number;        // Air temp from gateway (°C)
    airHumidity: number;           // Relative humidity (%)
    airPressure?: number;          // Optional barometric pressure (hPa)
    timestamp?: Date;
}

/**
 * Filters for querying sensor readings
 */
export interface SensorReadingFilters {
    nodeId?: number;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}

/**
 * Create a new sensor reading
 * 
 * @param input - Sensor reading data
 * @returns Created sensor reading
 */
export async function createSensorReading(input: SensorReadingInput) {
    try {
        return await prisma.sensorReading.create({
            data: {
                nodeId: input.nodeId,
                moisture: input.moisture,
                temperature: input.temperature,
                soilMoistureVWC: input.soilMoistureVWC,
                soilTemperature: input.soilTemperature,
                airTemperature: input.airTemperature,
                airHumidity: input.airHumidity,
                airPressure: input.airPressure ?? null,
                timestamp: input.timestamp ?? new Date(),
            },
        });
    } catch (error) {
        throw new DatabaseError('createSensorReading', error as Error);
    }
}

/**
 * Get latest sensor reading for a node
 * 
 * @param nodeId - Sensor node ID
 * @returns Latest reading or null
 */
export async function getLatestReading(nodeId: number) {
    try {
        return await prisma.sensorReading.findFirst({
            where: { nodeId },
            orderBy: { timestamp: 'desc' },
        });
    } catch (error) {
        throw new DatabaseError('getLatestReading', error as Error);
    }
}

/**
 * Get sensor readings with filters
 * 
 * @param filters - Query filters
 * @returns Array of sensor readings
 */
export async function getReadings(filters: SensorReadingFilters) {
    try {
        const where: any = {};

        if (filters.nodeId) {
            where.nodeId = filters.nodeId;
        }

        if (filters.startDate || filters.endDate) {
            where.timestamp = {};
            if (filters.startDate) {
                where.timestamp.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.timestamp.lte = filters.endDate;
            }
        }

        return await prisma.sensorReading.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: filters.limit ?? 100,
        });
    } catch (error) {
        throw new DatabaseError('getReadings', error as Error);
    }
}

/**
 * Get average soil readings over time period
 * 
 * @param nodeId - Sensor node ID
 * @param hours - Number of hours to average (default: 24)
 * @returns Average soil moisture and temperature
 */
export async function getAverageSoilReadings(nodeId: number, hours: number = 24) {
    try {
        const startTime = new Date();
        startTime.setHours(startTime.getHours() - hours);

        const readings = await prisma.sensorReading.findMany({
            where: {
                nodeId,
                timestamp: { gte: startTime },
            },
            select: {
                soilMoistureVWC: true,
                soilTemperature: true,
            },
        });

        if (readings.length === 0) {
            return null;
        }

        const avgMoisture = readings.reduce((sum, r) => sum + r.soilMoistureVWC, 0) / readings.length;
        const avgTemp = readings.reduce((sum, r) => sum + r.soilTemperature, 0) / readings.length;

        return {
            avgSoilMoistureVWC: Number(avgMoisture.toFixed(2)),
            avgSoilTemperature: Number(avgTemp.toFixed(2)),
            readingsCount: readings.length,
            periodHours: hours,
        };
    } catch (error) {
        throw new DatabaseError('getAverageSoilReadings', error as Error);
    }
}

/**
 * Get average air readings over time period
 * 
 * Includes air temperature, humidity, and pressure (if available)
 * 
 * @param nodeId - Sensor node ID
 * @param hours - Number of hours to average (default: 24)
 * @returns Average air temperature, humidity, and pressure
 */
export async function getAverageAirReadings(nodeId: number, hours: number = 24) {
    try {
        const startTime = new Date();
        startTime.setHours(startTime.getHours() - hours);

        const readings = await prisma.sensorReading.findMany({
            where: {
                nodeId,
                timestamp: { gte: startTime },
            },
            select: {
                airTemperature: true,
                airHumidity: true,
                airPressure: true,
            },
        });

        if (readings.length === 0) {
            return null;
        }

        // Calculate averages for required fields
        const avgTemp = readings.reduce((sum, r) => sum + r.airTemperature, 0) / readings.length;
        const avgHumidity = readings.reduce((sum, r) => sum + r.airHumidity, 0) / readings.length;

        // Calculate average air pressure (filter out nulls since it's optional)
        const pressures = readings
            .map(r => r.airPressure)
            .filter((p): p is number => p !== null && p !== undefined);

        const avgPressure = pressures.length > 0
            ? pressures.reduce((sum, p) => sum + p, 0) / pressures.length
            : null;

        return {
            avgAirTemperature: Number(avgTemp.toFixed(2)),
            avgAirHumidity: Number(avgHumidity.toFixed(2)),
            avgAirPressure: avgPressure !== null ? Number(avgPressure.toFixed(2)) : null,
            readingsCount: readings.length,
            periodHours: hours,
        };
    } catch (error) {
        throw new DatabaseError('getAverageAirReadings', error as Error);
    }
}

/**
 * Get readings count for a node
 * 
 * @param nodeId - Sensor node ID
 * @returns Total count of readings
 */
export async function getReadingsCount(nodeId: number): Promise<number> {
    try {
        return await prisma.sensorReading.count({
            where: { nodeId },
        });
    } catch (error) {
        throw new DatabaseError('getReadingsCount', error as Error);
    }
}

/**
 * Delete old sensor readings (maintenance)
 * 
 * @param olderThanDays - Delete readings older than this many days
 * @returns Number of deleted records
 */
export async function deleteOldReadings(olderThanDays: number): Promise<number> {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const result = await prisma.sensorReading.deleteMany({
            where: {
                timestamp: {
                    lt: cutoffDate,
                },
            },
        });

        return result.count;
    } catch (error) {
        throw new DatabaseError('deleteOldReadings', error as Error);
    }
}
