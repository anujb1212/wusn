/**
 * GDD (Growing Degree Days) Calculation Service
 * For crop growth stage tracking in North India
 *
 * GDD measures heat accumulation above a crop's base temperature.
 * Used to predict growth stages and optimize irrigation timing.
 */
import type { PrismaClient } from '@prisma/client';
/**
 * Base temperatures for North India crops (°C)
 * Below these temps, crops don't accumulate growth
 */
export declare const CROP_BASE_TEMPS: {
    readonly rice: 10;
    readonly wheat: 0;
    readonly maize: 8;
    readonly mustard: 0;
    readonly chickpea: 0;
    readonly cotton: 12;
    readonly sugarcane: 10;
    readonly pigeonpeas: 10;
    readonly kidneybeans: 8;
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
    readonly papaya: 15;
    readonly coconut: 20;
    readonly jute: 12;
    readonly coffee: 10;
};
/**
 * Total GDD requirements for maturity (North India climate)
 * These are accumulated degree-days from sowing to harvest
 */
export declare const CROP_GDD_REQUIREMENTS: {
    readonly rice: 2200;
    readonly wheat: 2700;
    readonly maize: 2400;
    readonly mustard: 2100;
    readonly chickpea: 1800;
    readonly cotton: 2800;
    readonly sugarcane: 5000;
    readonly pigeonpeas: 2500;
    readonly kidneybeans: 1800;
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
    readonly papaya: 3000;
    readonly coconut: 7000;
    readonly jute: 2200;
    readonly coffee: 3200;
};
/**
 * Upper temperature thresholds (°C)
 * Above these temps, GDD accumulation slows/stops
 */
export declare const CROP_UPPER_TEMPS: {
    readonly rice: 40;
    readonly wheat: 35;
    readonly maize: 38;
    readonly mustard: 35;
    readonly chickpea: 35;
    readonly cotton: 40;
    readonly sugarcane: 42;
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
 *
 * @param tempMax - Maximum temperature (°C)
 * @param tempMin - Minimum temperature (°C)
 * @param baseTemp - Crop base temperature (°C)
 * @returns Daily GDD value
 */
export declare function calculateDailyGDD(tempMax: number, tempMin: number, baseTemp: number): number;
/**
 * Calculate daily GDD with upper threshold (more accurate)
 * Formula: GDD = ((min(Tmax, Tupper) + max(Tmin, Tbase)) / 2) - Tbase
 *
 * @param tempMax - Maximum temperature (°C)
 * @param tempMin - Minimum temperature (°C)
 * @param baseTemp - Crop base temperature (°C)
 * @param upperTemp - Upper threshold temperature (°C)
 * @returns Daily GDD value
 */
export declare function calculateDailyGDDWithThreshold(tempMax: number, tempMin: number, baseTemp: number, upperTemp?: number): number;
/**
 * Calculate GDD from weather forecast (7-day projection)
 *
 * @param cropName - Crop name
 * @param forecast - Array of daily forecasts with temp_max_c and temp_min_c
 * @returns Total GDD accumulated over forecast period
 */
export declare function calculateForecastGDD(cropName: string, forecast: Array<{
    temp_max_c: number;
    temp_min_c: number;
}>): number;
/**
 * Map accumulated GDD to growth stage
 *
 * @param accumulatedGDD - Total GDD accumulated since sowing
 * @param totalRequiredGDD - Total GDD required for crop maturity
 * @returns Current growth stage
 */
export declare function getGrowthStage(accumulatedGDD: number, totalRequiredGDD: number): GrowthStage;
/**
 * Get detailed growth stage information
 *
 * @param cropName - Crop name
 * @param accumulatedGDD - Total GDD accumulated
 * @param daysElapsed - Days since sowing
 * @param avgDailyGDD - Average daily GDD (for estimation)
 * @returns Detailed growth stage info
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
 *
 * @param cropName - Crop name
 * @returns Base temperature in °C
 */
export declare function getCropBaseTemp(cropName: string): number;
/**
 * Get crop-specific GDD requirement
 *
 * @param cropName - Crop name
 * @returns Total GDD required for maturity
 */
export declare function getCropGDDRequirement(cropName: string): number;
/**
 * Get crop-specific upper temperature threshold
 *
 * @param cropName - Crop name
 * @returns Upper temperature threshold in °C
 */
export declare function getCropUpperTemp(cropName: string): number;
/**
 * Validate if crop is suitable for current temperature range
 *
 * @param cropName - Crop name
 * @param avgTemp - Average temperature
 * @param minTemp - Minimum temperature
 * @returns Suitability result with reason
 */
export declare function isCropSuitableForTemperature(cropName: string, avgTemp: number, minTemp: number): TemperatureSuitability;
/**
 * Update GDD for a field using weather data
 * Called daily or when weather data is fetched
 *
 * @param fieldId - Field ID
 * @param cropName - Crop name
 * @param sowingDate - Date crop was sown
 * @param tempMax - Maximum temperature for the day
 * @param tempMin - Minimum temperature for the day
 * @param prisma - PrismaClient instance
 * @returns GDD update result
 */
export declare function updateFieldGDD(fieldId: number, cropName: string, sowingDate: Date, tempMax: number, tempMin: number, prisma: PrismaClient): Promise<GDDUpdateResult>;
/**
 * Batch update GDD for all active fields
 * Should be called once per day
 *
 * @param weatherDataMap - Map of fieldId to weather data { temp_max_c, temp_min_c }
 * @param prisma - PrismaClient instance
 * @returns Array of update results
 */
export declare function batchUpdateGDD(weatherDataMap: Map<number, {
    temp_max_c: number;
    temp_min_c: number;
}>, prisma: PrismaClient): Promise<GDDUpdateResult[]>;
/**
 * Reset GDD for a field (when crop is changed or replanted)
 *
 * @param fieldId - Field ID
 * @param prisma - PrismaClient instance
 */
export declare function resetFieldGDD(fieldId: number, prisma: PrismaClient): Promise<void>;
/**
 * Calculate days elapsed since sowing
 */
export declare function getDaysElapsed(sowingDate: Date): number;
/**
 * Calculate average daily GDD from accumulated GDD and days
 */
export declare function getAverageDailyGDD(accumulatedGDD: number, daysElapsed: number): number;
/**
 * Get all available crops
 */
export declare function getAvailableCrops(): string[];
/**
 * Get crop parameters summary
 */
export declare function getCropParameters(cropName: string): {
    baseTemp: number;
    upperTemp: number;
    requiredGDD: number;
} | null;
//# sourceMappingURL=gddService.d.ts.map