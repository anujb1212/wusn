// src/repositories/sensor.repository.ts
/**
 * Sensor Reading Repository
 */
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { DatabaseError } from '../utils/errors.js';
import { getStartOfDay, getEndOfDay } from '../utils/dateHelpers.js';
/**
 * Create sensor reading
 */
export async function createSensorReading(input) {
    try {
        return await prisma.sensorReading.create({
            data: {
                nodeId: input.nodeId,
                moisture: input.moisture,
                temperature: input.temperature,
                soilMoistureVWC: input.soilMoistureVWC,
                soilTemperature: input.soilTemperature,
                rssi: null,
                batteryLevel: null,
                timestamp: input.timestamp,
            },
        });
    }
    catch (error) {
        throw new DatabaseError('createSensorReading', error);
    }
}
/**
 * Get latest reading
 */
export async function getLatestReading(nodeId) {
    try {
        return await prisma.sensorReading.findFirst({
            where: { nodeId },
            orderBy: { timestamp: 'desc' },
        });
    }
    catch (error) {
        throw new DatabaseError('getLatestReading', error);
    }
}
/**
 * Get readings with filters
 */
export async function getReadings(filters) {
    try {
        const where = {};
        if (filters.nodeId !== undefined) {
            where.nodeId = filters.nodeId;
        }
        if (filters.startDate || filters.endDate) {
            where.timestamp = {};
            if (filters.startDate) {
                where.timestamp.gte = getStartOfDay(filters.startDate);
            }
            if (filters.endDate) {
                where.timestamp.lte = getEndOfDay(filters.endDate);
            }
        }
        return await prisma.sensorReading.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: filters.limit || 100,
        });
    }
    catch (error) {
        throw new DatabaseError('getReadings', error);
    }
}
/**
 * Get readings for date
 */
export async function getReadingsForDate(nodeId, date) {
    try {
        return await prisma.sensorReading.findMany({
            where: {
                nodeId,
                timestamp: {
                    gte: getStartOfDay(date),
                    lte: getEndOfDay(date),
                },
                soilTemperature: { not: null },
            },
            orderBy: { timestamp: 'asc' },
        });
    }
    catch (error) {
        throw new DatabaseError('getReadingsForDate', error);
    }
}
/**
 * Get average readings
 */
export async function getAverageReadings(nodeId, hours = 24) {
    try {
        const since = new Date();
        since.setHours(since.getHours() - hours);
        const readings = await prisma.sensorReading.findMany({
            where: {
                nodeId,
                timestamp: { gte: since },
                soilMoistureVWC: { not: null },
                soilTemperature: { not: null },
            },
            select: {
                soilMoistureVWC: true,
                soilTemperature: true,
            },
        });
        if (readings.length === 0) {
            return null;
        }
        const sum = readings.reduce((acc, r) => {
            acc.vwc += r.soilMoistureVWC ?? 0;
            acc.temp += r.soilTemperature ?? 0;
            return acc;
        }, { vwc: 0, temp: 0 });
        return {
            avgSoilMoistureVWC: Number((sum.vwc / readings.length).toFixed(2)),
            avgSoilTemperature: Number((sum.temp / readings.length).toFixed(2)),
            readingsCount: readings.length,
        };
    }
    catch (error) {
        throw new DatabaseError('getAverageReadings', error);
    }
}
/**
 * Delete old readings
 */
export async function deleteOldReadings(daysToKeep = 90) {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const result = await prisma.sensorReading.deleteMany({
            where: {
                timestamp: { lt: cutoffDate },
            },
        });
        return result.count;
    }
    catch (error) {
        throw new DatabaseError('deleteOldReadings', error);
    }
}
//# sourceMappingURL=sensor.repository.js.map