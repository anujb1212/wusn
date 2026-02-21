/**
 * GDD (Growing Degree Days) Repository
 */
import { Prisma, GrowthStage } from '@prisma/client';
import { prisma } from '../config/database.js';
import { DatabaseError } from '../utils/errors.js';

export interface CreateGDDRecordInput {
    fieldId: number;
    date: Date;
    avgAirTemp: number;
    minAirTemp?: number | undefined;
    maxAirTemp?: number | undefined;
    readingsCount: number;
    dailyGDD: number;
    cumulativeGDD: number;
    cropType?: string | undefined;
    baseTemperature: number;
    growthStage?: string | undefined;
}

function toGrowthStage(value: unknown): GrowthStage | null {
    if (value === null || value === undefined) return null;

    // Already a valid enum value
    if (Object.values(GrowthStage).includes(value as GrowthStage)) {
        return value as GrowthStage;
    }

    // Try normalize string inputs like "initial", "INITIAL", etc.
    if (typeof value === 'string') {
        const normalized = value.trim().toUpperCase();
        if (Object.values(GrowthStage).includes(normalized as GrowthStage)) {
            return normalized as GrowthStage;
        }
    }

    // Invalid -> null (or throw if you want strict behavior)
    return null;
}

/**
 * Create GDD record
 */
export async function createGDDRecord(input: CreateGDDRecordInput) {
    try {
        return await prisma.gDDRecord.create({
            data: {
                fieldId: input.fieldId,
                date: input.date,
                avgAirTemp: input.avgAirTemp,
                minAirTemp: input.minAirTemp ?? null,
                maxAirTemp: input.maxAirTemp ?? null,
                readingsCount: input.readingsCount,
                dailyGDD: input.dailyGDD,
                cumulativeGDD: input.cumulativeGDD,
                cropType: input.cropType ?? null,
                baseTemperature: input.baseTemperature,
                growthStage: toGrowthStage(input.growthStage)
            },
        });
    } catch (error) {
        throw new DatabaseError('createGDDRecord', error as Error);
    }
}

/**
 * Get GDD record for specific date
 */
export async function getGDDRecordForDate(fieldId: number, date: Date) {
    try {
        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);

        return await prisma.gDDRecord.findUnique({
            where: {
                fieldId_date: {
                    fieldId,
                    date: dateOnly,
                },
            },
        });
    } catch (error) {
        throw new DatabaseError('getGDDRecordForDate', error as Error);
    }
}

/**
 * Get all GDD records for field since sowing
 */
export async function getGDDRecordsSinceSowing(fieldId: number, sowingDate: Date) {
    try {
        return await prisma.gDDRecord.findMany({
            where: {
                fieldId,
                date: { gte: sowingDate },
            },
            orderBy: { date: 'asc' },
        });
    } catch (error) {
        throw new DatabaseError('getGDDRecordsSinceSowing', error as Error);
    }
}

/**
 * Get latest GDD record
 */
export async function getLatestGDDRecord(fieldId: number) {
    try {
        return await prisma.gDDRecord.findFirst({
            where: { fieldId },
            orderBy: { date: 'desc' },
        });
    } catch (error) {
        throw new DatabaseError('getLatestGDDRecord', error as Error);
    }
}

/**
 * Delete GDD records for date range
 */
export async function deleteGDDRecordsInRange(
    fieldId: number,
    startDate: Date,
    endDate: Date
) {
    try {
        const result = await prisma.gDDRecord.deleteMany({
            where: {
                fieldId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        return result.count;
    } catch (error) {
        throw new DatabaseError('deleteGDDRecordsInRange', error as Error);
    }
}

/**
 * Get cumulative GDD for field
 */
export async function getCumulativeGDD(fieldId: number): Promise<number> {
    try {
        const latest = await getLatestGDDRecord(fieldId);
        return latest?.cumulativeGDD ?? 0;
    } catch (error) {
        throw new DatabaseError('getCumulativeGDD', error as Error);
    }
}
