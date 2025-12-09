/**
 * GDD (Growing Degree Days) Repository
 */
import { prisma } from '../config/database.js';
import { DatabaseError } from '../utils/errors.js';
/**
 * Create GDD record
 */
export async function createGDDRecord(input) {
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
                growthStage: input.growthStage ?? null,
            },
        });
    }
    catch (error) {
        throw new DatabaseError('createGDDRecord', error);
    }
}
/**
 * Get GDD record for specific date
 */
export async function getGDDRecordForDate(fieldId, date) {
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
    }
    catch (error) {
        throw new DatabaseError('getGDDRecordForDate', error);
    }
}
/**
 * Get all GDD records for field since sowing
 */
export async function getGDDRecordsSinceSowing(fieldId, sowingDate) {
    try {
        return await prisma.gDDRecord.findMany({
            where: {
                fieldId,
                date: { gte: sowingDate },
            },
            orderBy: { date: 'asc' },
        });
    }
    catch (error) {
        throw new DatabaseError('getGDDRecordsSinceSowing', error);
    }
}
/**
 * Get latest GDD record
 */
export async function getLatestGDDRecord(fieldId) {
    try {
        return await prisma.gDDRecord.findFirst({
            where: { fieldId },
            orderBy: { date: 'desc' },
        });
    }
    catch (error) {
        throw new DatabaseError('getLatestGDDRecord', error);
    }
}
/**
 * Delete GDD records for date range
 */
export async function deleteGDDRecordsInRange(fieldId, startDate, endDate) {
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
    }
    catch (error) {
        throw new DatabaseError('deleteGDDRecordsInRange', error);
    }
}
/**
 * Get cumulative GDD for field
 */
export async function getCumulativeGDD(fieldId) {
    try {
        const latest = await getLatestGDDRecord(fieldId);
        return latest?.cumulativeGDD ?? 0;
    }
    catch (error) {
        throw new DatabaseError('getCumulativeGDD', error);
    }
}
//# sourceMappingURL=gdd.repository.js.map