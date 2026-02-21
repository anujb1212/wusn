/**
 * GDD (Growing Degree Days) Service
 * 
 * Calculates daily and cumulative GDD from AIR temperature readings (not soil temperature)
 * 
 * Standard GDD Formula (Method 2 - recommended by USDA):
 *   Daily GDD = max(0, (Tmax + Tmin)/2 - Tbase)
 *   Where: If Tmin < Tbase, set Tmin = Tbase
 *          If Tmax < Tbase, set Tmax = Tbase
 *          If Tmax > Tupper (optional ceiling), set Tmax = Tupper
 * 
 * This method prevents negative contributions and properly handles cold days.
 * 
 * References:
 * - McMaster & Wilhelm (1997): "Growing degree-days: one equation, two interpretations"
 * - Michigan State University: Calculating Growing Degree Days
 * - FAO crop growth modeling standards
 * 
 * All calculations use AIR temperature from SensorReading.airTemperature, NOT soil temperature.
 * 
 * UPDATED: Dec 11, 2025 - Aligned with new Prisma CropParameters schema
 * Changes: stages.initial/development/midSeason/lateSeason → initialStageGDD/developmentStageGDD/midSeasonGDD/lateSeasonGDD
 */

import { createLogger } from '../../config/logger.js';
import { CROP_DATABASE, GROWTH_STAGES, VALID_CROPS } from '../../utils/constants.js';
import type { GrowthStage, CropName, CropParameters } from '../../utils/constants.js';
import { getFieldByNodeId, updateFieldGDD } from '../../repositories/field.repository.js';
import { getDailyAverageAirTemp } from '../../repositories/weather.repository.js';
import {
    createGDDRecord,
    getGDDRecordForDate,
    getLatestGDDRecord,
    getGDDRecordsSinceSowing,
    deleteGDDRecordsInRange,
} from '../../repositories/gdd.repository.js';
import type { GDDResult, GDDStatus } from '../../models/common.types.js';
import { ValidationError, NotFoundError } from '../../utils/errors.js';

const logger = createLogger({ service: 'gdd' });

/**
 * Upper temperature threshold (ceiling) for GDD calculation
 * Above this temperature, many crops show stress and limited growth
 * Set to 30°C based on USDA standards and crop physiology
 */
const UPPER_TEMP_THRESHOLD = 30;

/**
 * Calculate daily GDD value using Method 2 (USDA recommended)
 * 
 * Method 2: Adjust Tmin and Tmax before averaging
 * - If Tmin < Tbase, set Tmin = Tbase
 * - If Tmax < Tbase, set Tmax = Tbase
 * - If Tmax > Tupper, set Tmax = Tupper (optional ceiling)
 * - GDD = max(0, (Tmax_adj + Tmin_adj)/2 - Tbase)
 * 
 * This method better represents actual heat accumulation and prevents
 * negative GDD contributions on cold days.
 * 
 * @param minAirTemp - Daily minimum air temperature (°C)
 * @param maxAirTemp - Daily maximum air temperature (°C)
 * @param baseTemp - Crop-specific base temperature (°C)
 * @param upperThreshold - Optional upper temperature ceiling (°C)
 * @returns Daily GDD accumulated (degree-days)
 */
function calculateGDDValue(
    minAirTemp: number,
    maxAirTemp: number,
    baseTemp: number,
    upperThreshold: number = UPPER_TEMP_THRESHOLD
): number {
    // Adjust temperatures to base and upper thresholds
    const tminAdjusted = Math.max(minAirTemp, baseTemp);
    const tmaxAdjusted = Math.min(Math.max(maxAirTemp, baseTemp), upperThreshold);

    // Calculate average of adjusted temperatures
    const avgTemp = (tmaxAdjusted + tminAdjusted) / 2;

    // GDD = average adjusted temp - base temp (cannot be negative)
    const gdd = Math.max(0, avgTemp - baseTemp);

    return gdd;
}

/**
 * Determine growth stage from cumulative GDD progress
 * 
 * Uses GDD thresholds from CROP_DATABASE (initialStageGDD, developmentStageGDD, etc.)
 * Stages based on cumulative GDD accumulated
 * 
 * FIXED: Now uses initialStageGDD/developmentStageGDD/midSeasonGDD/lateSeasonGDD
 * instead of stages.initial/development/midSeason/lateSeason
 */
function determineGrowthStageFromGDD(
    cumulativeGDD: number,
    cropParams: CropParameters
): GrowthStage {
    const { initialStageGDD, developmentStageGDD, midSeasonGDD, lateSeasonGDD } = cropParams;

    if (cumulativeGDD < initialStageGDD) {
        return GROWTH_STAGES.INITIAL;
    } else if (cumulativeGDD < developmentStageGDD) {
        return GROWTH_STAGES.DEVELOPMENT;
    } else if (cumulativeGDD < midSeasonGDD) {
        return GROWTH_STAGES.MID_SEASON;
    } else if (cumulativeGDD < lateSeasonGDD) {
        return GROWTH_STAGES.LATE_SEASON;
    } else {
        return GROWTH_STAGES.HARVEST_READY;
    }
}

/**
 * Calculate GDD for a specific day and update field
 * 
 * Process:
 * 1. Validate field has confirmed crop and sowing date
 * 2. Check date is not before sowing
 * 3. Get daily min/max air temperatures from gateway readings
 * 4. Calculate daily GDD using USDA Method 2
 * 5. Add to cumulative GDD
 * 6. Determine growth stage
 * 7. Save GDD record and update field
 * 
 * @param nodeId - Sensor node ID
 * @param date - Date to calculate GDD for
 * @returns GDDResult or null if cannot calculate
 */
export async function calculateDailyGDD(
    nodeId: number,
    date: Date
): Promise<GDDResult | null> {
    try {
        const field = await getFieldByNodeId(nodeId);
        if (!field) {
            throw new NotFoundError('Field', `nodeId=${nodeId}`);
        }

        // Validate field configuration
        if (!field.cropConfirmed || !field.sowingDate || !field.baseTemperature || !field.cropType) {
            logger.warn(
                { nodeId, cropConfirmed: field.cropConfirmed, hasSowingDate: !!field.sowingDate },
                'Field not configured for GDD calculation'
            );
            return null;
        }

        // Normalize dates to midnight for comparison
        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);

        const sowingDateOnly = new Date(field.sowingDate);
        sowingDateOnly.setHours(0, 0, 0, 0);

        // Don't calculate GDD before sowing
        if (dateOnly < sowingDateOnly) {
            logger.debug({ nodeId, date: dateOnly.toISOString().split('T')[0] }, 'Date before sowing, skipping');
            return null;
        }

        // Check if already calculated
        const existing = await getGDDRecordForDate(field.id, dateOnly);
        if (existing) {
            logger.debug({ nodeId, date: dateOnly.toISOString().split('T')[0] }, 'GDD already calculated');
            return {
                date: existing.date,
                dailyGDD: existing.dailyGDD,
                cumulativeGDD: existing.cumulativeGDD,
                avgAirTemp: existing.avgAirTemp,
                minAirTemp: existing.minAirTemp ?? existing.avgAirTemp,
                maxAirTemp: existing.maxAirTemp ?? existing.avgAirTemp,
                growthStage: existing.growthStage as GrowthStage,
                readingsCount: existing.readingsCount,
            };
        }

        // Get daily air temperature data (aggregated from SensorReading.airTemperature)
        const tempData = await getDailyAverageAirTemp(field.gatewayId, dateOnly);
        if (!tempData || tempData.readingsCount === 0) {
            logger.warn({ nodeId, date: dateOnly.toISOString().split('T')[0] }, 'No air temperature data available');
            return null;
        }

        // Validate min/max temperatures exist
        if (tempData.minAirTemp == null || tempData.maxAirTemp == null) {
            logger.warn(
                { nodeId, date: dateOnly.toISOString().split('T')[0], tempData },
                'Missing min/max air temperature, cannot calculate GDD'
            );
            return null;
        }

        // Calculate daily GDD using USDA Method 2
        const dailyGDDValue = calculateGDDValue(
            tempData.minAirTemp,
            tempData.maxAirTemp,
            field.baseTemperature
        );

        // Get previous cumulative GDD (chronologically)
        const latestRecord = await getLatestGDDRecord(field.id);
        const previousCumulativeGDD = latestRecord?.cumulativeGDD ?? 0;
        const cumulativeGDD = previousCumulativeGDD + dailyGDDValue;

        // Determine growth stage
        const cropParams = CROP_DATABASE[field.cropType as CropName];
        if (!cropParams) {
            throw new ValidationError(`Invalid crop type: ${field.cropType}`);
        }

        const growthStage = determineGrowthStageFromGDD(cumulativeGDD, cropParams);

        // Save GDD record
        const record = await createGDDRecord({
            fieldId: field.id,
            date: dateOnly,
            avgAirTemp: tempData.avgAirTemp,
            minAirTemp: tempData.minAirTemp,
            maxAirTemp: tempData.maxAirTemp,
            readingsCount: tempData.readingsCount,
            dailyGDD: Number(dailyGDDValue.toFixed(2)),
            cumulativeGDD: Number(cumulativeGDD.toFixed(2)),
            cropType: field.cropType,
            baseTemperature: field.baseTemperature,
            growthStage,
        });

        // Update field with latest GDD state
        await updateFieldGDD(nodeId, cumulativeGDD, growthStage);

        logger.info(
            {
                nodeId,
                date: dateOnly.toISOString().split('T')[0],
                dailyGDD: dailyGDDValue.toFixed(2),
                cumulativeGDD: cumulativeGDD.toFixed(2),
                growthStage,
                tempRange: `${tempData.minAirTemp.toFixed(1)}-${tempData.maxAirTemp.toFixed(1)}°C`,
            },
            'GDD calculated and recorded'
        );

        return {
            date: record.date,
            dailyGDD: record.dailyGDD,
            cumulativeGDD: record.cumulativeGDD,
            avgAirTemp: record.avgAirTemp,
            minAirTemp: record.minAirTemp ?? record.avgAirTemp,
            maxAirTemp: record.maxAirTemp ?? record.avgAirTemp,
            growthStage: record.growthStage as GrowthStage,
            readingsCount: record.readingsCount,
        };

    } catch (error) {
        logger.error({ error, nodeId, date: date.toISOString() }, 'Failed to calculate daily GDD');
        throw error;
    }
}

/**
 * Get current GDD status for a field
 * 
 * Returns comprehensive GDD tracking information including:
 * - Cumulative GDD accumulated
 * - Progress percentage toward maturity
 * - Current growth stage
 * - Days from sowing
 * - Estimated days to harvest
 * 
 * FIXED: Now calculates expectedGDDTotal from cropParams.lateSeasonGDD
 * 
 * @param nodeId - Sensor node ID
 * @returns GDDStatus
 * @throws ValidationError if field doesn't have confirmed crop
 */
export async function getGDDStatus(nodeId: number): Promise<GDDStatus> {
    try {
        const field = await getFieldByNodeId(nodeId);
        if (!field) {
            throw new NotFoundError('Field', `nodeId=${nodeId}`);
        }

        if (!field.cropConfirmed || !field.sowingDate || !field.cropType) {
            throw new ValidationError('Field does not have confirmed crop with sowing date');
        }

        // Get crop parameters to determine total GDD required
        const cropParams = CROP_DATABASE[field.cropType as CropName];
        if (!cropParams) {
            throw new ValidationError(`Invalid crop type: ${field.cropType}`);
        }

        // Total GDD to maturity = lateSeasonGDD (cumulative to harvest)
        const expectedGDDTotal = cropParams.lateSeasonGDD;

        const now = new Date();
        const sowingDate = new Date(field.sowingDate);
        const daysFromSowing = Math.floor(
            (now.getTime() - sowingDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Calculate progress percentage
        const accumulatedGDD = field.accumulatedGDD ?? 0;
        const progressPercent = expectedGDDTotal > 0
            ? (accumulatedGDD / expectedGDDTotal) * 100
            : 0;

        // Estimate days to harvest based on average daily GDD accumulation
        let estimatedDaysToHarvest: number | null = null;
        if (accumulatedGDD > 0 && daysFromSowing > 0) {
            const remainingGDD = Math.max(0, expectedGDDTotal - accumulatedGDD);
            const avgDailyGDD = accumulatedGDD / daysFromSowing;

            if (avgDailyGDD > 0) {
                estimatedDaysToHarvest = Math.ceil(remainingGDD / avgDailyGDD);
            }
        }

        // If already at or past harvest ready, days to harvest is 0
        if (progressPercent >= 100) {
            estimatedDaysToHarvest = 0;
        }

        return {
            fieldId: field.id,
            nodeId: field.nodeId,
            cropType: field.cropType as CropName | null,
            sowingDate: field.sowingDate,
            accumulatedGDD: accumulatedGDD,
            expectedGDDTotal: expectedGDDTotal,
            progressPercent: Number(progressPercent.toFixed(1)),
            currentStage: (field.currentGrowthStage as GrowthStage) ?? GROWTH_STAGES.INITIAL,
            daysFromSowing,
            estimatedDaysToHarvest,
            lastUpdate: field.lastGDDUpdate,
        };

    } catch (error) {
        logger.error({ error, nodeId }, 'Failed to get GDD status');
        throw error;
    }
}

/**
 * Recalculate GDD for a date range (batch processing)
 * 
 * Useful for:
 * - Correcting historical data after sensor calibration
 * - Backfilling missing GDD records
 * - Recalculating after base temperature change
 * 
 * WARNING: Deletes existing records in range before recalculating
 * 
 * @param nodeId - Sensor node ID
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns Number of days successfully calculated
 */
export async function recalculateGDDRange(
    nodeId: number,
    startDate: Date,
    endDate: Date
): Promise<number> {
    try {
        const field = await getFieldByNodeId(nodeId);
        if (!field) {
            throw new NotFoundError('Field', `nodeId=${nodeId}`);
        }

        if (!field.cropConfirmed || !field.sowingDate) {
            throw new ValidationError('Field does not have confirmed crop');
        }

        const startDateOnly = new Date(startDate);
        startDateOnly.setHours(0, 0, 0, 0);

        const endDateOnly = new Date(endDate);
        endDateOnly.setHours(0, 0, 0, 0);

        logger.info(
            {
                nodeId,
                startDate: startDateOnly.toISOString().split('T')[0],
                endDate: endDateOnly.toISOString().split('T')[0],
            },
            'Starting GDD recalculation for date range'
        );

        // Delete existing records in range
        const deletedCount = await deleteGDDRecordsInRange(field.id, startDateOnly, endDateOnly);
        logger.debug({ nodeId, deletedCount }, 'Deleted existing GDD records');

        // Calculate for each day in range
        let calculatedCount = 0;
        const currentDate = new Date(startDateOnly);

        while (currentDate <= endDateOnly) {
            const result = await calculateDailyGDD(nodeId, new Date(currentDate));
            if (result) {
                calculatedCount++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        logger.info(
            { nodeId, calculatedCount, requestedDays: Math.floor((endDateOnly.getTime() - startDateOnly.getTime()) / (1000 * 60 * 60 * 24)) + 1 },
            'GDD recalculation complete'
        );

        return calculatedCount;

    } catch (error) {
        logger.error(
            { error, nodeId, startDate: startDate.toISOString(), endDate: endDate.toISOString() },
            'Failed to recalculate GDD range'
        );
        throw error;
    }
}

/**
 * Calculate missing GDD records since sowing date
 * 
 * Identifies gaps in GDD record history and fills them.
 * Useful for:
 * - Catching up after system downtime
 * - Initial GDD calculation for newly confirmed crops
 * - Daily scheduled job to calculate yesterday's GDD
 * 
 * @param nodeId - Sensor node ID
 * @returns Number of missing records successfully calculated
 */
export async function calculateMissingGDD(nodeId: number): Promise<number> {
    try {
        const field = await getFieldByNodeId(nodeId);
        if (!field) {
            throw new NotFoundError('Field', `nodeId=${nodeId}`);
        }

        if (!field.cropConfirmed || !field.sowingDate) {
            logger.debug({ nodeId }, 'Field has no confirmed crop, skipping missing GDD calculation');
            return 0;
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Calculate up to yesterday (today's data may be incomplete)
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        // Get existing GDD records since sowing
        const existingRecords = await getGDDRecordsSinceSowing(field.id, field.sowingDate);
        const existingDates = new Set(
            existingRecords.map(r => {
                const d = new Date(r.date);
                d.setHours(0, 0, 0, 0);
                return d.toISOString().split('T')[0];
            })
        );

        // Find all dates between sowing and yesterday that don't have records
        const missingDates: Date[] = [];
        const currentDate = new Date(field.sowingDate);
        currentDate.setHours(0, 0, 0, 0);

        while (currentDate <= yesterday) {
            const dateStr = currentDate.toISOString().split('T')[0];
            if (dateStr && !existingDates.has(dateStr)) {
                missingDates.push(new Date(currentDate));
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        if (missingDates.length === 0) {
            logger.debug({ nodeId }, 'No missing GDD records found');
            return 0;
        }

        logger.info(
            { nodeId, missingCount: missingDates.length, dateRange: `${missingDates[0]?.toISOString().split('T')[0]} to ${missingDates[missingDates.length - 1]?.toISOString().split('T')[0]}` },
            'Calculating missing GDD records'
        );

        // Calculate GDD for each missing date (in chronological order)
        let calculatedCount = 0;
        for (const date of missingDates) {
            try {
                const result = await calculateDailyGDD(nodeId, date);
                if (result) {
                    calculatedCount++;
                }
            } catch (error) {
                logger.warn({ error, nodeId, date: date.toISOString() }, 'Failed to calculate GDD for specific date, continuing...');
            }
        }

        logger.info(
            { nodeId, calculatedCount, missingCount: missingDates.length },
            'Missing GDD calculation complete'
        );

        return calculatedCount;

    } catch (error) {
        logger.error({ error, nodeId }, 'Failed to calculate missing GDD records');
        throw error;
    }
}
