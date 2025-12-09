// src/services/gdd/gdd.service.ts
/**
 * GDD (Growing Degree Days) Service
 * Calculates daily and cumulative GDD from air temperature readings
 * Formula: GDD = max(0, avgAirTemp - baseTemp)
 */
import { createLogger } from '../../config/logger.js';
import { CROP_DATABASE, GROWTH_STAGES } from '../../utils/constants.js';
import { getFieldByNodeId, updateFieldGDD } from '../../repositories/field.repository.js';
import { getDailyAverageAirTemp } from '../../repositories/weather.repository.js';
import { createGDDRecord, getGDDRecordForDate, getLatestGDDRecord, getGDDRecordsSinceSowing, deleteGDDRecordsInRange, } from '../../repositories/gdd.repository.js';
import { ValidationError } from '../../utils/errors.js';
const logger = createLogger({ service: 'gdd' });
/**
 * Calculate daily GDD
 */
function calculateDailyGDDValue(avgAirTemp, baseTemp) {
    return Math.max(0, avgAirTemp - baseTemp);
}
/**
 * Determine growth stage from cumulative GDD
 */
function determineGrowthStage(cumulativeGDD, totalGDD, cropType) {
    const progress = (cumulativeGDD / totalGDD) * 100;
    const cropParams = CROP_DATABASE[cropType];
    if (progress < cropParams.stages.initial) {
        return GROWTH_STAGES.INITIAL;
    }
    else if (progress < cropParams.stages.development) {
        return GROWTH_STAGES.DEVELOPMENT;
    }
    else if (progress < cropParams.stages.midSeason) {
        return GROWTH_STAGES.MID_SEASON;
    }
    else if (progress < cropParams.stages.lateSeason) {
        return GROWTH_STAGES.LATE_SEASON;
    }
    else {
        return GROWTH_STAGES.HARVEST_READY;
    }
}
/**
 * Calculate GDD for a specific day
 */
export async function calculateDailyGDD(nodeId, date) {
    try {
        const field = await getFieldByNodeId(nodeId);
        if (!field.cropConfirmed || !field.sowingDate || !field.baseTemperature) {
            logger.warn({ nodeId }, 'Field not configured for GDD calculation');
            return null;
        }
        // Check if date is before sowing
        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);
        const sowingDateOnly = new Date(field.sowingDate);
        sowingDateOnly.setHours(0, 0, 0, 0);
        if (dateOnly < sowingDateOnly) {
            logger.debug({ nodeId, date: dateOnly }, 'Date before sowing, skipping');
            return null;
        }
        // Check if already calculated
        const existing = await getGDDRecordForDate(field.id, dateOnly);
        if (existing) {
            logger.debug({ nodeId, date: dateOnly }, 'GDD already calculated for date');
            return {
                date: existing.date,
                dailyGDD: existing.dailyGDD,
                cumulativeGDD: existing.cumulativeGDD,
                avgAirTemp: existing.avgAirTemp,
                growthStage: existing.growthStage,
                readingsCount: existing.readingsCount,
            };
        }
        // Get air temperature data
        const tempData = await getDailyAverageAirTemp(field.gatewayId, dateOnly);
        if (!tempData) {
            logger.warn({ nodeId, date: dateOnly }, 'No air temperature data available');
            return null;
        }
        // Calculate daily GDD
        const dailyGDD = calculateDailyGDDValue(tempData.avgAirTemp, field.baseTemperature);
        // Get previous cumulative GDD
        const latestRecord = await getLatestGDDRecord(field.id);
        const cumulativeGDD = (latestRecord?.cumulativeGDD ?? 0) + dailyGDD;
        // Determine growth stage
        const growthStage = field.expectedGDDTotal && field.cropType
            ? determineGrowthStage(cumulativeGDD, field.expectedGDDTotal, field.cropType)
            : GROWTH_STAGES.INITIAL;
        // Save record
        const record = await createGDDRecord({
            fieldId: field.id,
            date: dateOnly,
            avgAirTemp: tempData.avgAirTemp,
            minAirTemp: tempData.minAirTemp,
            maxAirTemp: tempData.maxAirTemp,
            readingsCount: tempData.readingsCount,
            dailyGDD: Number(dailyGDD.toFixed(2)),
            cumulativeGDD: Number(cumulativeGDD.toFixed(2)),
            cropType: field.cropType ?? undefined,
            baseTemperature: field.baseTemperature,
            growthStage,
        });
        // Update field
        await updateFieldGDD(nodeId, cumulativeGDD, growthStage);
        logger.info({ nodeId, date: dateOnly, dailyGDD, cumulativeGDD, growthStage }, 'GDD calculated');
        return {
            date: record.date,
            dailyGDD: record.dailyGDD,
            cumulativeGDD: record.cumulativeGDD,
            avgAirTemp: record.avgAirTemp,
            growthStage: record.growthStage,
            readingsCount: record.readingsCount,
        };
    }
    catch (error) {
        logger.error({ error, nodeId, date }, 'Failed to calculate daily GDD');
        throw error;
    }
}
/**
 * Get current GDD status for field
 */
export async function getGDDStatus(nodeId) {
    try {
        const field = await getFieldByNodeId(nodeId);
        if (!field.cropConfirmed || !field.sowingDate) {
            throw new ValidationError('Field does not have confirmed crop');
        }
        const now = new Date();
        const sowingDate = new Date(field.sowingDate);
        const daysFromSowing = Math.floor((now.getTime() - sowingDate.getTime()) / (1000 * 60 * 60 * 24));
        const progressPercent = field.expectedGDDTotal
            ? (field.accumulatedGDD / field.expectedGDDTotal) * 100
            : 0;
        let estimatedDaysToHarvest = null;
        if (field.expectedGDDTotal && field.accumulatedGDD > 0) {
            const remainingGDD = field.expectedGDDTotal - field.accumulatedGDD;
            const avgDailyGDD = field.accumulatedGDD / Math.max(daysFromSowing, 1);
            estimatedDaysToHarvest = Math.ceil(remainingGDD / avgDailyGDD);
        }
        return {
            fieldId: field.id,
            nodeId: field.nodeId,
            cropType: field.cropType,
            sowingDate: field.sowingDate,
            accumulatedGDD: field.accumulatedGDD,
            expectedGDDTotal: field.expectedGDDTotal,
            progressPercent: Number(progressPercent.toFixed(1)),
            currentStage: field.currentGrowthStage ?? GROWTH_STAGES.INITIAL,
            daysFromSowing,
            estimatedDaysToHarvest,
            lastUpdate: field.lastGDDUpdate,
        };
    }
    catch (error) {
        logger.error({ error, nodeId }, 'Failed to get GDD status');
        throw error;
    }
}
/**
 * Recalculate GDD for date range (batch processing)
 */
export async function recalculateGDDRange(nodeId, startDate, endDate) {
    try {
        const field = await getFieldByNodeId(nodeId);
        if (!field.cropConfirmed || !field.sowingDate) {
            throw new ValidationError('Field does not have confirmed crop');
        }
        logger.info({ nodeId, startDate, endDate }, 'Recalculating GDD range');
        // Delete existing records in range
        await deleteGDDRecordsInRange(field.id, startDate, endDate);
        // Calculate for each day
        let count = 0;
        const currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0);
        const endDateOnly = new Date(endDate);
        endDateOnly.setHours(0, 0, 0, 0);
        while (currentDate <= endDateOnly) {
            const result = await calculateDailyGDD(nodeId, new Date(currentDate));
            if (result) {
                count++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        logger.info({ nodeId, count }, 'GDD recalculation complete');
        return count;
    }
    catch (error) {
        logger.error({ error, nodeId, startDate, endDate }, 'Failed to recalculate GDD range');
        throw error;
    }
}
/**
 * Calculate missing GDD records since sowing
 */
export async function calculateMissingGDD(nodeId) {
    try {
        const field = await getFieldByNodeId(nodeId);
        if (!field.cropConfirmed || !field.sowingDate) {
            return 0;
        }
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        // Get existing records
        const existingRecords = await getGDDRecordsSinceSowing(field.id, field.sowingDate);
        const existingDates = new Set(existingRecords.map(r => r.date.toISOString().split('T')[0]));
        // Find missing dates
        const missingDates = [];
        const currentDate = new Date(field.sowingDate);
        currentDate.setHours(0, 0, 0, 0);
        while (currentDate <= yesterday) {
            const dateStr = currentDate.toISOString().split('T')[0];
            if (dateStr && !existingDates.has(dateStr)) {
                missingDates.push(new Date(currentDate));
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        logger.info({ nodeId, missingCount: missingDates.length }, 'Calculating missing GDD records');
        // Calculate missing
        let calculated = 0;
        for (const date of missingDates) {
            const result = await calculateDailyGDD(nodeId, date);
            if (result) {
                calculated++;
            }
        }
        return calculated;
    }
    catch (error) {
        logger.error({ error, nodeId }, 'Failed to calculate missing GDD');
        throw error;
    }
}
//# sourceMappingURL=gdd.service.js.map