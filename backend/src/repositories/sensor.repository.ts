/**
 * Sensor Reading Repository
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { DatabaseError } from '../utils/errors.js';

export interface SensorReadingInput {
    nodeId: number;
    moisture: number;
    temperature: number;
    soilMoistureVWC: number;
    soilTemperature: number;
    airTemperature: number;
    airHumidity: number;
    airPressure?: number;
    timestamp?: Date;
}

export interface SensorReadingFilters {
    nodeId?: number;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}

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

export async function getReadings(filters: SensorReadingFilters) {
    try {
        const where: Prisma.SensorReadingWhereInput = {};

        if (typeof filters.nodeId === 'number') {
            where.nodeId = filters.nodeId;
        }

        if (filters.startDate || filters.endDate) {
            where.timestamp = {};
            if (filters.startDate) where.timestamp.gte = filters.startDate;
            if (filters.endDate) where.timestamp.lte = filters.endDate;
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

export async function getAverageSoilReadings(nodeId: number, hours: number = 24) {
    try {
        const startTime = new Date();
        startTime.setHours(startTime.getHours() - hours);

        const readings = await prisma.sensorReading.findMany({
            where: { nodeId, timestamp: { gte: startTime } },
            select: { soilMoistureVWC: true, soilTemperature: true },
        });

        const valid = readings.filter(
            (r) => typeof r.soilMoistureVWC === 'number' && typeof r.soilTemperature === 'number'
        );

        if (valid.length === 0) return null;

        const avgMoisture = valid.reduce((sum, r) => sum + r.soilMoistureVWC, 0) / valid.length;
        const avgTemp = valid.reduce((sum, r) => sum + r.soilTemperature, 0) / valid.length;

        return {
            avgSoilMoistureVWC: Number(avgMoisture.toFixed(2)),
            avgSoilTemperature: Number(avgTemp.toFixed(2)),
            readingsCount: valid.length,
            periodHours: hours,
        };
    } catch (error) {
        throw new DatabaseError('getAverageSoilReadings', error as Error);
    }
}

export async function getAverageAirReadings(nodeId: number, hours: number = 24) {
    try {
        const startTime = new Date();
        startTime.setHours(startTime.getHours() - hours);

        const readings = await prisma.sensorReading.findMany({
            where: { nodeId, timestamp: { gte: startTime } },
            select: { airTemperature: true, airHumidity: true, airPressure: true },
        });

        const valid = readings.filter(
            (r) => typeof r.airTemperature === 'number' && typeof r.airHumidity === 'number'
        );

        if (valid.length === 0) return null;

        const avgTemp = valid.reduce((sum, r) => sum + r.airTemperature, 0) / valid.length;
        const avgHumidity = valid.reduce((sum, r) => sum + r.airHumidity, 0) / valid.length;

        const pressures = readings
            .map((r) => r.airPressure)
            .filter((p): p is number => typeof p === 'number');

        const avgPressure =
            pressures.length > 0 ? pressures.reduce((sum, p) => sum + p, 0) / pressures.length : null;

        return {
            avgAirTemperature: Number(avgTemp.toFixed(2)),
            avgAirHumidity: Number(avgHumidity.toFixed(2)),
            avgAirPressure: avgPressure !== null ? Number(avgPressure.toFixed(2)) : null,
            readingsCount: valid.length,
            periodHours: hours,
        };
    } catch (error) {
        throw new DatabaseError('getAverageAirReadings', error as Error);
    }
}

export async function getReadingsCount(nodeId: number): Promise<number> {
    try {
        return await prisma.sensorReading.count({ where: { nodeId } });
    } catch (error) {
        throw new DatabaseError('getReadingsCount', error as Error);
    }
}

export async function deleteOldReadings(olderThanDays: number): Promise<number> {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const result = await prisma.sensorReading.deleteMany({
            where: { timestamp: { lt: cutoffDate } },
        });

        return result.count;
    } catch (error) {
        throw new DatabaseError('deleteOldReadings', error as Error);
    }
}
