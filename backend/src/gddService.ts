import type { PrismaClient } from '@prisma/client';

/**
 * Base temperatures for ALL dataset crops (°C)
 * Below these temps, crops don't accumulate growth
 */
export const CROP_BASE_TEMPS = {
    rice: 10,
    maize: 8,
    chickpea: 0,
    kidneybeans: 8,
    pigeonpeas: 10,
    mothbeans: 8,
    mungbean: 10,
    blackgram: 10,
    lentil: 0,
    pomegranate: 10,
    banana: 14,
    mango: 10,
    grapes: 10,
    watermelon: 15,
    muskmelon: 15,
    apple: 4,
    orange: 10,
    papaya: 15,
    coconut: 20,
    cotton: 12,
    jute: 12,
    coffee: 10
} as const;

/**
 * Total GDD requirements for maturity (North India climate)
 * These are accumulated degree-days from sowing to harvest
 */
export const CROP_GDD_REQUIREMENTS = {
    rice: 2200,
    maize: 2400,
    chickpea: 1800,
    kidneybeans: 1800,
    pigeonpeas: 2500,
    mothbeans: 1600,
    mungbean: 1400,
    blackgram: 1300,
    lentil: 1900,
    pomegranate: 3500,
    banana: 3600,
    mango: 4000,
    grapes: 2800,
    watermelon: 1800,
    muskmelon: 1600,
    apple: 2500,
    orange: 2800,
    papaya: 3000,
    coconut: 7000,
    cotton: 2800,
    jute: 2200,
    coffee: 3200
} as const;

/**
 * Upper temperature thresholds (°C)
 * Above these temps, GDD accumulation slows/stops
 */
export const CROP_UPPER_TEMPS = {
    rice: 40,
    maize: 38,
    chickpea: 35,
    kidneybeans: 35,
    pigeonpeas: 38,
    mothbeans: 40,
    mungbean: 38,
    blackgram: 38,
    lentil: 35,
    pomegranate: 42,
    banana: 38,
    mango: 42,
    grapes: 38,
    watermelon: 42,
    muskmelon: 42,
    apple: 32,
    orange: 38,
    papaya: 38,
    coconut: 45,
    cotton: 40,
    jute: 38,
    coffee: 35,
    default: 35
} as const;

export type CropName = keyof typeof CROP_BASE_TEMPS;

/**
 * Growth stages based on GDD percentage
 */
export type GrowthStage =
    | 'INITIAL'
    | 'DEVELOPMENT'
    | 'MID_SEASON'
    | 'LATE_SEASON'
    | 'HARVEST_READY';


export interface GrowthStageInfo {
    stage: GrowthStage;
    progress: number; // 0-100%
    daysElapsed: number;
    gddAccumulated: number;
    gddRequired: number;
    gddRemaining: number;
    estimatedDaysToMaturity: number;
    description_en: string;
    description_hi: string;
}

export interface GDDUpdateResult {
    previousGDD: number;
    newGDD: number;
    dailyGDDAdded: number;
    growthStage: GrowthStage;
    progress: number;
}

export interface TemperatureSuitability {
    suitable: boolean;
    reason: string;
    baseTemp: number;
    avgTemp: number;
}


/**
 * Calculate daily GDD using simple average method
 * Formula: GDD = ((Tmax + Tmin) / 2) - Tbase
 * Negative values clamped to 0
 */
export function calculateDailyGDD(
    tempMax: number,
    tempMin: number,
    baseTemp: number
): number {
    const avgTemp = (tempMax + tempMin) / 2;
    const gdd = Math.max(0, avgTemp - baseTemp);

    return Math.round(gdd * 10) / 10;
}

/**
 * Calculate daily GDD with upper threshold (more accurate)
 */
export function calculateDailyGDDWithThreshold(
    tempMax: number,
    tempMin: number,
    baseTemp: number,
    upperTemp: number = 35
): number {
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
 * Calculate GDD from weather forecast (7-day projection)
 */
export function calculateForecastGDD(
    cropName: string,
    forecast: Array<{ temp_max_c: number; temp_min_c: number }>
): number {
    const baseTemp = getCropBaseTemp(cropName);

    let totalGDD = 0;
    forecast.forEach(day => {
        totalGDD += calculateDailyGDD(day.temp_max_c, day.temp_min_c, baseTemp);
    });

    return Math.round(totalGDD * 10) / 10;
}

/**
 * Map accumulated GDD to growth stage
 */
export function getGrowthStage(
    accumulatedGDD: number,
    totalRequiredGDD: number
): GrowthStage {
    const progress = (accumulatedGDD / totalRequiredGDD) * 100;

    if (progress < 15) return 'INITIAL';
    if (progress < 40) return 'DEVELOPMENT';
    if (progress < 75) return 'MID_SEASON';
    if (progress < 95) return 'LATE_SEASON';
    return 'HARVEST_READY';
}

/**
 * Get detailed growth stage information
 */
export function getGrowthStageInfo(
    cropName: string,
    accumulatedGDD: number,
    daysElapsed: number,
    avgDailyGDD: number = 20
): GrowthStageInfo {
    const normalizedCrop = cropName.toLowerCase().replace(/\s+/g, '') as CropName;

    const requiredGDD = CROP_GDD_REQUIREMENTS[normalizedCrop] || 2000;
    const progress = Math.min(100, (accumulatedGDD / requiredGDD) * 100);
    const stage = getGrowthStage(accumulatedGDD, requiredGDD);
    const gddRemaining = Math.max(0, requiredGDD - accumulatedGDD);

    const estimatedDaysToMaturity = avgDailyGDD > 0
        ? Math.ceil(gddRemaining / avgDailyGDD)
        : 0;

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
        description_hi: description.name_hi
    };
}

/**
 * Get human-readable growth stage description
 */
export function getGrowthStageDescription(stage: GrowthStage): {
    name_en: string;
    name_hi: string;
    description: string;
} {
    const descriptions = {
        INITIAL: {
            name_en: 'Initial / Germination',
            name_hi: 'प्रारंभिक / अंकुरण',
            description: 'Seed germination and early seedling establishment. Low water demand.'
        },
        DEVELOPMENT: {
            name_en: 'Vegetative Development',
            name_hi: 'वानस्पतिक विकास',
            description: 'Active vegetative growth. Leaves and stems developing. Increasing water need.'
        },
        MID_SEASON: {
            name_en: 'Mid-Season / Flowering',
            name_hi: 'मध्य-मौसम / फूल आना',
            description: 'Peak growth and flowering. Maximum water demand. Critical irrigation period.'
        },
        LATE_SEASON: {
            name_en: 'Late Season / Grain Filling',
            name_hi: 'देर से मौसम / अनाज भरना',
            description: 'Grain/fruit filling and maturation. Water demand decreasing.'
        },
        HARVEST_READY: {
            name_en: 'Harvest Ready / Maturity',
            name_hi: 'कटाई के लिए तैयार',
            description: 'Crop matured and ready for harvest. Minimal water needed.'
        }
    };

    return descriptions[stage];
}

/**
 * Get crop-specific base temperature
 */
export function getCropBaseTemp(cropName: string): number {
    const normalizedCrop = cropName.toLowerCase().replace(/\s+/g, '') as CropName;
    return CROP_BASE_TEMPS[normalizedCrop] || 10; // Default 10°C
}

/**
 * Get crop-specific GDD requirement
 */
export function getCropGDDRequirement(cropName: string): number {
    const normalizedCrop = cropName.toLowerCase().replace(/\s+/g, '') as CropName;
    return CROP_GDD_REQUIREMENTS[normalizedCrop] || 2000; // Default 2000
}

/**
 * Get crop-specific upper temperature threshold
 */
export function getCropUpperTemp(cropName: string): number {
    const normalizedCrop = cropName.toLowerCase().replace(/\s+/g, '');
    return (CROP_UPPER_TEMPS as any)[normalizedCrop] || CROP_UPPER_TEMPS.default;
}

/**
 * Validate if crop is suitable for current temperature range
 */
export function isCropSuitableForTemperature(
    cropName: string,
    avgTemp: number,
    minTemp: number
): TemperatureSuitability {
    const baseTemp = getCropBaseTemp(cropName);

    if (avgTemp < baseTemp) {
        return {
            suitable: false,
            reason: `Temperature too low (${avgTemp}°C < ${baseTemp}°C base). Crop will not accumulate GDD.`,
            baseTemp,
            avgTemp
        };
    }

    if (minTemp < baseTemp - 5) {
        return {
            suitable: false,
            reason: `Night temperature too low (${minTemp}°C). Risk of frost damage.`,
            baseTemp,
            avgTemp
        };
    }

    return {
        suitable: true,
        reason: `Temperature suitable for ${cropName} (avg ${avgTemp}°C, base ${baseTemp}°C)`,
        baseTemp,
        avgTemp
    };
}


/**
 * Update GDD for a field using weather data
 */
export async function updateFieldGDD(
    fieldId: number,
    cropName: string,
    sowingDate: Date,
    tempMax: number,
    tempMin: number,
    prisma: PrismaClient
): Promise<GDDUpdateResult> {
    const field = await prisma.field.findUnique({
        where: { id: fieldId }
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
            currentGrowthStage: stage
        }
    });

    console.log(`✅ GDD updated for field ${fieldId}: ${previousGDD.toFixed(1)} → ${newGDD.toFixed(1)} (stage: ${stage})`);

    return {
        previousGDD: Math.round(previousGDD * 10) / 10,
        newGDD: Math.round(newGDD * 10) / 10,
        dailyGDDAdded: dailyGDD,
        growthStage: stage,
        progress: Math.round(progress * 10) / 10
    };
}

/**
 * Batch update GDD for all active fields
 */
export async function batchUpdateGDD(
    weatherDataMap: Map<number, { temp_max_c: number; temp_min_c: number }>,
    prisma: PrismaClient
): Promise<GDDUpdateResult[]> {
    const results: GDDUpdateResult[] = [];

    const fields = await prisma.field.findMany({
        where: {
            cropConfirmed: true,
            selectedCrop: { not: null },
            sowingDate: { not: null }
        }
    });

    console.log(`🔄 Batch updating GDD for ${fields.length} fields...`);

    for (const field of fields) {
        const weather = weatherDataMap.get(field.id);

        if (!weather || !field.selectedCrop || !field.sowingDate) {
            continue;
        }

        try {
            const result = await updateFieldGDD(
                field.id,
                field.selectedCrop,
                field.sowingDate,
                weather.temp_max_c,
                weather.temp_min_c,
                prisma
            );

            results.push(result);
        } catch (error) {
            console.error(`❌ Error updating GDD for field ${field.id}:`, error);
        }
    }

    console.log(`✅ Batch GDD update complete: ${results.length} fields updated`);

    return results;
}

/**
 * Reset GDD for a field
 */
export async function resetFieldGDD(
    fieldId: number,
    prisma: PrismaClient
): Promise<void> {
    await prisma.field.update({
        where: { id: fieldId },
        data: {
            accumulatedGDD: 0,
            lastGDDUpdate: null,
            currentGrowthStage: null
        }
    });

    console.log(`🔄 GDD reset for field ${fieldId}`);
}

export function getDaysElapsed(sowingDate: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - sowingDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function getAverageDailyGDD(
    accumulatedGDD: number,
    daysElapsed: number
): number {
    if (daysElapsed === 0) return 0;
    return Math.round((accumulatedGDD / daysElapsed) * 10) / 10;
}

export function getAvailableCrops(): string[] {
    return Object.keys(CROP_BASE_TEMPS);
}

export function getCropParameters(cropName: string): {
    baseTemp: number;
    upperTemp: number;
    requiredGDD: number;
} | null {
    const normalizedCrop = cropName.toLowerCase().replace(/\s+/g, '') as CropName;

    if (!CROP_BASE_TEMPS[normalizedCrop]) {
        return null;
    }

    return {
        baseTemp: getCropBaseTemp(cropName),
        upperTemp: getCropUpperTemp(cropName),
        requiredGDD: getCropGDDRequirement(cropName)
    };
}
