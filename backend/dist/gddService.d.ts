import type { PrismaClient } from '@prisma/client';
/**
 * Base temperatures for ALL dataset crops (°C)
 * Below these temps, crops don't accumulate growth
 */
export declare const CROP_BASE_TEMPS: {
    readonly rice: 10;
    readonly maize: 8;
    readonly chickpea: 0;
    readonly kidneybeans: 8;
    readonly pigeonpeas: 10;
    readonly mothbeans: 8;
    readonly mungbean: 10;
    readonly blackgram: 10;
    readonly lentil: 0;
    readonly pomegranate: 10;
    readonly banana: 14;
    readonly mango: 10;
    readonly grapes: 10;
    readonly watermelon: 15;
    readonly muskmelon: 15;
    readonly apple: 4;
    readonly orange: 10;
    readonly papaya: 15;
    readonly coconut: 20;
    readonly cotton: 12;
    readonly jute: 12;
    readonly coffee: 10;
};
/**
 * Total GDD requirements for maturity (North India climate)
 * These are accumulated degree-days from sowing to harvest
 */
export declare const CROP_GDD_REQUIREMENTS: {
    readonly rice: 2200;
    readonly maize: 2400;
    readonly chickpea: 1800;
    readonly kidneybeans: 1800;
    readonly pigeonpeas: 2500;
    readonly mothbeans: 1600;
    readonly mungbean: 1400;
    readonly blackgram: 1300;
    readonly lentil: 1900;
    readonly pomegranate: 3500;
    readonly banana: 3600;
    readonly mango: 4000;
    readonly grapes: 2800;
    readonly watermelon: 1800;
    readonly muskmelon: 1600;
    readonly apple: 2500;
    readonly orange: 2800;
    readonly papaya: 3000;
    readonly coconut: 7000;
    readonly cotton: 2800;
    readonly jute: 2200;
    readonly coffee: 3200;
};
/**
 * Upper temperature thresholds (°C)
 * Above these temps, GDD accumulation slows/stops
 */
export declare const CROP_UPPER_TEMPS: {
    readonly rice: 40;
    readonly maize: 38;
    readonly chickpea: 35;
    readonly kidneybeans: 35;
    readonly pigeonpeas: 38;
    readonly mothbeans: 40;
    readonly mungbean: 38;
    readonly blackgram: 38;
    readonly lentil: 35;
    readonly pomegranate: 42;
    readonly banana: 38;
    readonly mango: 42;
    readonly grapes: 38;
    readonly watermelon: 42;
    readonly muskmelon: 42;
    readonly apple: 32;
    readonly orange: 38;
    readonly papaya: 38;
    readonly coconut: 45;
    readonly cotton: 40;
    readonly jute: 38;
    readonly coffee: 35;
    readonly default: 35;
};
export type CropName = keyof typeof CROP_BASE_TEMPS;
/**
 * Growth stages based on GDD percentage
 */
export type GrowthStage = 'INITIAL' | 'DEVELOPMENT' | 'MID_SEASON' | 'LATE_SEASON' | 'HARVEST_READY';
export interface GrowthStageInfo {
    stage: GrowthStage;
    progress: number;
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
export declare function calculateDailyGDD(tempMax: number, tempMin: number, baseTemp: number): number;
/**
 * Calculate daily GDD with upper threshold (more accurate)
 */
export declare function calculateDailyGDDWithThreshold(tempMax: number, tempMin: number, baseTemp: number, upperTemp?: number): number;
/**
 * Calculate GDD from weather forecast (7-day projection)
 */
export declare function calculateForecastGDD(cropName: string, forecast: Array<{
    temp_max_c: number;
    temp_min_c: number;
}>): number;
/**
 * Map accumulated GDD to growth stage
 */
export declare function getGrowthStage(accumulatedGDD: number, totalRequiredGDD: number): GrowthStage;
/**
 * Get detailed growth stage information
 */
export declare function getGrowthStageInfo(cropName: string, accumulatedGDD: number, daysElapsed: number, avgDailyGDD?: number): GrowthStageInfo;
/**
 * Get human-readable growth stage description
 */
export declare function getGrowthStageDescription(stage: GrowthStage): {
    name_en: string;
    name_hi: string;
    description: string;
};
/**
 * Get crop-specific base temperature
 */
export declare function getCropBaseTemp(cropName: string): number;
/**
 * Get crop-specific GDD requirement
 */
export declare function getCropGDDRequirement(cropName: string): number;
/**
 * Get crop-specific upper temperature threshold
 */
export declare function getCropUpperTemp(cropName: string): number;
/**
 * Validate if crop is suitable for current temperature range
 */
export declare function isCropSuitableForTemperature(cropName: string, avgTemp: number, minTemp: number): TemperatureSuitability;
/**
 * Update GDD for a field using weather data
 */
export declare function updateFieldGDD(fieldId: number, cropName: string, sowingDate: Date, tempMax: number, tempMin: number, prisma: PrismaClient): Promise<GDDUpdateResult>;
/**
 * Batch update GDD for all active fields
 */
export declare function batchUpdateGDD(weatherDataMap: Map<number, {
    temp_max_c: number;
    temp_min_c: number;
}>, prisma: PrismaClient): Promise<GDDUpdateResult[]>;
/**
 * Reset GDD for a field
 */
export declare function resetFieldGDD(fieldId: number, prisma: PrismaClient): Promise<void>;
export declare function getDaysElapsed(sowingDate: Date): number;
export declare function getAverageDailyGDD(accumulatedGDD: number, daysElapsed: number): number;
export declare function getAvailableCrops(): string[];
export declare function getCropParameters(cropName: string): {
    baseTemp: number;
    upperTemp: number;
    requiredGDD: number;
} | null;
//# sourceMappingURL=gddService.d.ts.map