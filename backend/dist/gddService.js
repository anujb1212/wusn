import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
/**
 * Base temperatures for UP-valid crops only (°C)
 * Below these temps, crops don't accumulate growth
 * Source: ICAR research + Kaggle dataset
 */
export const CROP_BASE_TEMPS = {
    // RABI (2 crops)
    chickpea: 5,
    lentil: 5,
    // KHARIF (8 crops)
    rice: 10,
    maize: 8,
    cotton: 12,
    pigeonpeas: 10,
    mothbeans: 10,
    mungbean: 10,
    blackgram: 10,
    kidneybeans: 8,
    // ZAID (2 crops)
    watermelon: 15,
    muskmelon: 15,
    // Non-UP crops (from CSV but invalid for UP)
    pomegranate: 10,
    banana: 14,
    mango: 10,
    grapes: 10,
    apple: 4,
    orange: 10,
    papaya: 15,
    coconut: 20,
    jute: 12,
    coffee: 10,
};
/**
 * Total GDD requirements for maturity (UP climate-specific)
 */
export const CROP_GDD_REQUIREMENTS = {
    // RABI (2 crops)
    chickpea: 1930,
    lentil: 1800,
    // KHARIF (8 crops)
    rice: 2800,
    maize: 2000,
    cotton: 2500,
    pigeonpeas: 2300,
    mothbeans: 1600,
    mungbean: 1400,
    blackgram: 1300,
    kidneybeans: 1700,
    // ZAID (2 crops)
    watermelon: 1500,
    muskmelon: 1400,
    // Non-UP crops
    pomegranate: 3500,
    banana: 3600,
    mango: 4000,
    grapes: 2800,
    apple: 2500,
    orange: 2800,
    papaya: 3000,
    coconut: 7000,
    jute: 2200,
    coffee: 3200,
};
/**
 * Upper temperature thresholds (°C)
 */
export const CROP_UPPER_TEMPS = {
    // RABI
    chickpea: 35,
    lentil: 35,
    // KHARIF
    rice: 40,
    maize: 38,
    cotton: 40,
    pigeonpeas: 38,
    mothbeans: 40,
    mungbean: 38,
    blackgram: 38,
    kidneybeans: 35,
    // ZAID
    watermelon: 42,
    muskmelon: 42,
    // Non-UP
    pomegranate: 42,
    banana: 38,
    mango: 42,
    grapes: 38,
    apple: 32,
    orange: 38,
    papaya: 38,
    coconut: 45,
    jute: 38,
    coffee: 35,
    default: 35,
};
/**
 * UP-valid crops only (12 crops from Kaggle CSV)
 * Excludes: wheat (not in CSV), tropical fruits, perennials
 */
export const UP_VALID_CROPS = [
    'chickpea',
    'lentil',
    'rice',
    'maize',
    'cotton',
    'pigeonpeas',
    'mothbeans',
    'mungbean',
    'blackgram',
    'kidneybeans',
    'watermelon',
    'muskmelon',
];
/**
 * Calculate daily GDD from 5-minute soil temperature readings
 * Aggregates all readings for a date, computes average, then calculates GDD
 *
 * Formula: dailyGDD = max(0, avgSoilTemp - baseTemp)
 *
 * This is the PRIMARY GDD calculation method for underground sensors
 */
export async function calculateDailyGDDFromSoilTemp(nodeId, date) {
    try {
        console.log(`[GDD] Calculating daily GDD for node ${nodeId}, date ${date.toISOString().split('T')[0]}`);
        // Get field configuration
        const fieldConfig = await prisma.fieldConfig.findUnique({
            where: { nodeId },
        });
        if (!fieldConfig || !fieldConfig.sowingDate || !fieldConfig.cropType) {
            console.log(`[GDD] Skipping: No sowing date or crop type set for node ${nodeId}`);
            return;
        }
        // Ensure date is after sowing date
        const sowingDateStart = new Date(fieldConfig.sowingDate);
        sowingDateStart.setHours(0, 0, 0, 0);
        if (date < sowingDateStart) {
            console.log(`[GDD] Skipping: Date is before sowing date`);
            return;
        }
        const baseTemp = fieldConfig.baseTemperature || getCropBaseTemp(fieldConfig.cropType);
        const totalGDD = fieldConfig.expectedGDDTotal || getCropGDDRequirement(fieldConfig.cropType);
        // Get start and end of day in UTC
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        // Fetch all soil temperature readings for this day
        const readings = await prisma.sensorReading.findMany({
            where: {
                nodeId,
                timestamp: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                soilTemperature: { not: null },
            },
            select: {
                soilTemperature: true,
                temperature: true,
            },
        });
        // ✅ FIX: If no readings, skip silently (don't create GDD record)
        if (readings.length === 0) {
            console.log(`[GDD] No readings for ${date.toISOString().split('T')[0]} - skipping`);
            return; // ✅ Just return, don't throw error or create record
        }
        // Calculate daily average, min, max soil temperature
        const temps = readings.map(r => r.soilTemperature ?? r.temperature);
        const avgSoilTemp = temps.reduce((sum, t) => sum + t, 0) / temps.length;
        const minSoilTemp = Math.min(...temps);
        const maxSoilTemp = Math.max(...temps);
        // Calculate daily GDD (always >= 0)
        const dailyGDD = Math.max(0, avgSoilTemp - baseTemp);
        console.log(`[GDD] Date: ${date.toISOString().split('T')[0]}, ` +
            `Readings: ${readings.length}, ` +
            `Avg Temp: ${avgSoilTemp.toFixed(2)}°C, ` +
            `Daily GDD: ${dailyGDD.toFixed(2)}`);
        // Get previous cumulative GDD
        const previousGDD = await prisma.gDDHistory.findFirst({
            where: {
                nodeId,
                date: { lt: startOfDay },
            },
            orderBy: { date: 'desc' },
        });
        const cumulativeGDD = (previousGDD?.cumulativeGDD || 0) + dailyGDD;
        // Determine growth stage
        const growthStageResult = determineGrowthStage(cumulativeGDD, totalGDD);
        // Upsert GDD history record
        await prisma.gDDHistory.upsert({
            where: {
                nodeId_date: {
                    nodeId,
                    date: startOfDay,
                },
            },
            create: {
                nodeId,
                date: startOfDay,
                avgSoilTemp,
                minSoilTemp,
                maxSoilTemp,
                dailyGDD,
                cumulativeGDD,
                readingsCount: readings.length,
                cropType: fieldConfig.cropType,
                baseTemperature: baseTemp,
                growthStage: growthStageResult.stage,
            },
            update: {
                avgSoilTemp,
                minSoilTemp,
                maxSoilTemp,
                dailyGDD,
                cumulativeGDD,
                readingsCount: readings.length,
                growthStage: growthStageResult.stage,
            },
        });
        console.log(`[GDD] Saved: Cumulative GDD = ${cumulativeGDD.toFixed(2)}, ` +
            `Stage = ${growthStageResult.stage}`);
        // Update Field model for backward compatibility
        const linkedField = await prisma.field.findFirst({
            where: { linkedNodeId: nodeId },
        });
        if (linkedField) {
            await prisma.field.update({
                where: { id: linkedField.id },
                data: {
                    accumulatedGDD: cumulativeGDD,
                    lastGDDUpdate: new Date(),
                    currentGrowthStage: growthStageResult.stage,
                },
            });
        }
    }
    catch (error) {
        console.error(`[GDD] Error calculating daily GDD:`, error);
        // ✅ FIX: Don't throw, just log and continue
        // throw error;
    }
}
/**
 * Determines growth stage based on accumulated GDD percentage
 */
export function determineGrowthStage(cumulativeGDD, totalGDD) {
    const percentage = (cumulativeGDD / totalGDD) * 100;
    let stage;
    if (percentage < 15) {
        stage = 'INITIAL';
    }
    else if (percentage < 40) {
        stage = 'DEVELOPMENT';
    }
    else if (percentage < 75) {
        stage = 'MID_SEASON';
    }
    else if (percentage < 95) {
        stage = 'LATE_SEASON';
    }
    else {
        stage = 'HARVEST_READY';
    }
    console.log(`[GDD] Growth stage: ${stage} (${percentage.toFixed(1)}% of total GDD)`);
    return { stage, percentage };
}
/**
 * Calculate GDD for multiple days (batch processing)
 * Useful for backfilling historical data after sowing
 */
export async function calculateGDDForDateRange(nodeId, startDate, endDate) {
    console.log(`[GDD] Batch calculating GDD from ${startDate.toISOString().split('T')[0]} ` +
        `to ${endDate.toISOString().split('T')[0]}`);
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        await calculateDailyGDDFromSoilTemp(nodeId, new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    console.log(`[GDD] Batch calculation complete`);
}
/**
 * Get latest GDD and growth stage for a node
 */
export async function getLatestGDDStatus(nodeId) {
    const latestGDD = await prisma.gDDHistory.findFirst({
        where: { nodeId },
        orderBy: { date: 'desc' },
    });
    const fieldConfig = await prisma.fieldConfig.findUnique({
        where: { nodeId },
    });
    return {
        latestGDD,
        fieldConfig,
        totalGDDRequired: fieldConfig?.cropType
            ? getCropGDDRequirement(fieldConfig.cropType)
            : null,
    };
}
/**
 * Calculate daily GDD using simple average method (for weather data)
 */
export function calculateDailyGDD(tempMax, tempMin, baseTemp) {
    const avgTemp = (tempMax + tempMin) / 2;
    const gdd = Math.max(0, avgTemp - baseTemp);
    return Math.round(gdd * 10) / 10;
}
/**
 * Calculate daily GDD with upper threshold
 */
export function calculateDailyGDDWithThreshold(tempMax, tempMin, baseTemp, upperTemp = 35) {
    const adjustedMax = Math.min(tempMax, upperTemp);
    const adjustedMin = Math.max(tempMin, baseTemp);
    if (adjustedMin >= adjustedMax) {
        return 0;
    }
    const avgTemp = (adjustedMax + adjustedMin) / 2;
    const gdd = Math.max(0, avgTemp - baseTemp);
    return Math.round(gdd * 10) / 10;
}
/**
 * Map accumulated GDD to growth stage
 */
export function getGrowthStage(accumulatedGDD, totalRequiredGDD) {
    const progress = (accumulatedGDD / totalRequiredGDD) * 100;
    if (progress < 15)
        return 'INITIAL';
    if (progress < 40)
        return 'DEVELOPMENT';
    if (progress < 75)
        return 'MID_SEASON';
    if (progress < 95)
        return 'LATE_SEASON';
    return 'HARVEST_READY';
}
/**
 * Get detailed growth stage information
 */
export function getGrowthStageInfo(cropName, accumulatedGDD, daysElapsed, avgDailyGDD = 20) {
    const normalizedCrop = cropName.toLowerCase().replace(/\s+/g, '');
    const requiredGDD = CROP_GDD_REQUIREMENTS[normalizedCrop] || 2000;
    const progress = Math.min(100, (accumulatedGDD / requiredGDD) * 100);
    const stage = getGrowthStage(accumulatedGDD, requiredGDD);
    const gddRemaining = Math.max(0, requiredGDD - accumulatedGDD);
    const estimatedDaysToMaturity = avgDailyGDD > 0 ? Math.ceil(gddRemaining / avgDailyGDD) : 0;
    const description = getGrowthStageDescription(stage);
    return {
        stage,
        progress: Math.round(progress * 10) / 10,
        daysElapsed,
        gddAccumulated: Math.round(accumulatedGDD * 10) / 10,
        gddRequired: requiredGDD,
        gddRemaining: Math.round(gddRemaining * 10) / 10,
        estimatedDaysToMaturity,
        description_en: description.description,
        description_hi: description.name_hi,
    };
}
/**
 * Get human-readable growth stage description
 */
export function getGrowthStageDescription(stage) {
    const descriptions = {
        INITIAL: {
            name_en: 'Initial / Germination',
            name_hi: 'प्रारंभिक / अंकुरण',
            description: 'Seed germination and early seedling establishment. Low water demand.',
        },
        DEVELOPMENT: {
            name_en: 'Vegetative Development',
            name_hi: 'वानस्पतिक विकास',
            description: 'Active vegetative growth. Leaves and stems developing. Increasing water need.',
        },
        MID_SEASON: {
            name_en: 'Mid-Season / Flowering',
            name_hi: 'मध्य-मौसम / फूल आना',
            description: 'Peak growth and flowering. Maximum water demand. Critical irrigation period.',
        },
        LATE_SEASON: {
            name_en: 'Late Season / Grain Filling',
            name_hi: 'देर से मौसम / अनाज भरना',
            description: 'Grain/fruit filling and maturation. Water demand decreasing.',
        },
        HARVEST_READY: {
            name_en: 'Harvest Ready / Maturity',
            name_hi: 'कटाई के लिए तैयार',
            description: 'Crop matured and ready for harvest. Minimal water needed.',
        },
    };
    return descriptions[stage];
}
/**
 * Get crop-specific base temperature
 */
export function getCropBaseTemp(cropName) {
    const normalizedCrop = cropName.toLowerCase().replace(/\s+/g, '');
    return CROP_BASE_TEMPS[normalizedCrop] || 10;
}
/**
 * Get crop-specific GDD requirement
 */
export function getCropGDDRequirement(cropName) {
    const normalizedCrop = cropName.toLowerCase().replace(/\s+/g, '');
    return CROP_GDD_REQUIREMENTS[normalizedCrop] || 2000;
}
/**
 * Get crop-specific upper temperature threshold
 */
export function getCropUpperTemp(cropName) {
    const normalizedCrop = cropName.toLowerCase().replace(/\s+/g, '');
    return CROP_UPPER_TEMPS[normalizedCrop] || CROP_UPPER_TEMPS.default;
}
/**
 * Filter out non-UP crops from any list
 */
export function filterUPCrops(crops) {
    return crops.filter((crop) => UP_VALID_CROPS.includes(crop.toLowerCase().replace(/\s+/g, '')));
}
export function getDaysElapsed(sowingDate) {
    const now = new Date();
    const diffMs = now.getTime() - sowingDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
export function getAverageDailyGDD(accumulatedGDD, daysElapsed) {
    if (daysElapsed === 0)
        return 0;
    return Math.round((accumulatedGDD / daysElapsed) * 10) / 10;
}
export function getAvailableCrops() {
    return Object.keys(CROP_BASE_TEMPS);
}
export function getAvailableUPCrops() {
    return UP_VALID_CROPS;
}
export function getCropParameters(cropName) {
    const normalizedCrop = cropName.toLowerCase().replace(/\s+/g, '');
    if (!CROP_BASE_TEMPS[normalizedCrop]) {
        return null;
    }
    return {
        baseTemp: getCropBaseTemp(cropName),
        upperTemp: getCropUpperTemp(cropName),
        requiredGDD: getCropGDDRequirement(cropName),
    };
}
/**
 * Validate if crop is suitable for current temperature range
 */
export function isCropSuitableForTemperature(cropName, avgTemp, minTemp) {
    const baseTemp = getCropBaseTemp(cropName);
    if (avgTemp < baseTemp) {
        return {
            suitable: false,
            reason: `Temperature too low (${avgTemp}°C < ${baseTemp}°C base). Crop will not accumulate GDD.`,
            baseTemp,
            avgTemp,
        };
    }
    if (minTemp < baseTemp - 5) {
        return {
            suitable: false,
            reason: `Night temperature too low (${minTemp}°C). Risk of frost damage.`,
            baseTemp,
            avgTemp,
        };
    }
    return {
        suitable: true,
        reason: `Temperature suitable for ${cropName} (avg ${avgTemp}°C, base ${baseTemp}°C)`,
        baseTemp,
        avgTemp,
    };
}
// Keep existing field-based functions for backward compatibility
export async function updateFieldGDD(fieldId, cropName, sowingDate, tempMax, tempMin, prisma) {
    const field = await prisma.field.findUnique({
        where: { id: fieldId },
    });
    if (!field) {
        throw new Error(`Field ${fieldId} not found`);
    }
    const baseTemp = getCropBaseTemp(cropName);
    const upperTemp = getCropUpperTemp(cropName);
    const dailyGDD = calculateDailyGDDWithThreshold(tempMax, tempMin, baseTemp, upperTemp);
    const previousGDD = field.accumulatedGDD || 0;
    const newGDD = previousGDD + dailyGDD;
    const requiredGDD = getCropGDDRequirement(cropName);
    const stage = getGrowthStage(newGDD, requiredGDD);
    const progress = (newGDD / requiredGDD) * 100;
    await prisma.field.update({
        where: { id: fieldId },
        data: {
            accumulatedGDD: newGDD,
            lastGDDUpdate: new Date(),
            currentGrowthStage: stage,
        },
    });
    console.log(`✅ GDD updated for field ${fieldId}: ${previousGDD.toFixed(1)} → ${newGDD.toFixed(1)} (stage: ${stage})`);
    return {
        previousGDD: Math.round(previousGDD * 10) / 10,
        newGDD: Math.round(newGDD * 10) / 10,
        dailyGDDAdded: dailyGDD,
        growthStage: stage,
        progress: Math.round(progress * 10) / 10,
    };
}
export async function resetFieldGDD(fieldId, prisma) {
    await prisma.field.update({
        where: { id: fieldId },
        data: {
            accumulatedGDD: 0,
            lastGDDUpdate: null,
            currentGrowthStage: null,
        },
    });
    console.log(`🔄 GDD reset for field ${fieldId}`);
}
//# sourceMappingURL=gddService.js.map