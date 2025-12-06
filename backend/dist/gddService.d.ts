import { PrismaClient } from '@prisma/client';
/**
 * Base temperatures for UP-valid crops only (°C)
 * Below these temps, crops don't accumulate growth
 * Source: ICAR research + Kaggle dataset
 */
export declare const CROP_BASE_TEMPS: {
    readonly chickpea: 5;
    readonly lentil: 5;
    readonly rice: 10;
    readonly maize: 8;
    readonly cotton: 12;
    readonly pigeonpeas: 10;
    readonly mothbeans: 10;
    readonly mungbean: 10;
    readonly blackgram: 10;
    readonly kidneybeans: 8;
    readonly watermelon: 15;
    readonly muskmelon: 15;
    readonly pomegranate: 10;
    readonly banana: 14;
    readonly mango: 10;
    readonly grapes: 10;
    readonly apple: 4;
    readonly orange: 10;
    readonly papaya: 15;
    readonly coconut: 20;
    readonly jute: 12;
    readonly coffee: 10;
};
/**
 * Total GDD requirements for maturity (UP climate-specific)
 */
export declare const CROP_GDD_REQUIREMENTS: {
    readonly chickpea: 1930;
    readonly lentil: 1800;
    readonly rice: 2800;
    readonly maize: 2000;
    readonly cotton: 2500;
    readonly pigeonpeas: 2300;
    readonly mothbeans: 1600;
    readonly mungbean: 1400;
    readonly blackgram: 1300;
    readonly kidneybeans: 1700;
    readonly watermelon: 1500;
    readonly muskmelon: 1400;
    readonly pomegranate: 3500;
    readonly banana: 3600;
    readonly mango: 4000;
    readonly grapes: 2800;
    readonly apple: 2500;
    readonly orange: 2800;
    readonly papaya: 3000;
    readonly coconut: 7000;
    readonly jute: 2200;
    readonly coffee: 3200;
};
/**
 * Upper temperature thresholds (°C)
 */
export declare const CROP_UPPER_TEMPS: {
    readonly chickpea: 35;
    readonly lentil: 35;
    readonly rice: 40;
    readonly maize: 38;
    readonly cotton: 40;
    readonly pigeonpeas: 38;
    readonly mothbeans: 40;
    readonly mungbean: 38;
    readonly blackgram: 38;
    readonly kidneybeans: 35;
    readonly watermelon: 42;
    readonly muskmelon: 42;
    readonly pomegranate: 42;
    readonly banana: 38;
    readonly mango: 42;
    readonly grapes: 38;
    readonly apple: 32;
    readonly orange: 38;
    readonly papaya: 38;
    readonly coconut: 45;
    readonly jute: 38;
    readonly coffee: 35;
    readonly default: 35;
};
/**
 * UP-valid crops only (12 crops from Kaggle CSV)
 * Excludes: wheat (not in CSV), tropical fruits, perennials
 */
export declare const UP_VALID_CROPS: readonly ["chickpea", "lentil", "rice", "maize", "cotton", "pigeonpeas", "mothbeans", "mungbean", "blackgram", "kidneybeans", "watermelon", "muskmelon"];
export type CropName = keyof typeof CROP_BASE_TEMPS;
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
 * Calculate daily GDD from 5-minute soil temperature readings
 * Aggregates all readings for a date, computes average, then calculates GDD
 *
 * Formula: dailyGDD = max(0, avgSoilTemp - baseTemp)
 *
 * This is the PRIMARY GDD calculation method for underground sensors
 */
export declare function calculateDailyGDDFromSoilTemp(nodeId: number, date: Date): Promise<void>;
/**
 * Determines growth stage based on accumulated GDD percentage
 */
export declare function determineGrowthStage(cumulativeGDD: number, totalGDD: number): {
    stage: GrowthStage;
    percentage: number;
};
/**
 * Calculate GDD for multiple days (batch processing)
 * Useful for backfilling historical data after sowing
 */
export declare function calculateGDDForDateRange(nodeId: number, startDate: Date, endDate: Date): Promise<void>;
/**
 * Get latest GDD and growth stage for a node
 */
export declare function getLatestGDDStatus(nodeId: number): Promise<{
    latestGDD: {
        id: number;
        nodeId: number;
        cropType: string | null;
        baseTemperature: number | null;
        createdAt: Date;
        date: Date;
        avgSoilTemp: number;
        minSoilTemp: number | null;
        maxSoilTemp: number | null;
        readingsCount: number;
        dailyGDD: number;
        cumulativeGDD: number;
        growthStage: string | null;
    } | null;
    fieldConfig: {
        id: number;
        nodeId: number;
        fieldName: string;
        soilTexture: string;
        cropType: string | null;
        sowingDate: Date | null;
        expectedHarvestDate: Date | null;
        baseTemperature: number | null;
        expectedGDDTotal: number | null;
        location: string | null;
        latitude: number | null;
        longitude: number | null;
        createdAt: Date;
        updatedAt: Date;
    } | null;
    totalGDDRequired: number | null;
}>;
/**
 * Calculate daily GDD using simple average method (for weather data)
 */
export declare function calculateDailyGDD(tempMax: number, tempMin: number, baseTemp: number): number;
/**
 * Calculate daily GDD with upper threshold
 */
export declare function calculateDailyGDDWithThreshold(tempMax: number, tempMin: number, baseTemp: number, upperTemp?: number): number;
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
 * Filter out non-UP crops from any list
 */
export declare function filterUPCrops(crops: string[]): string[];
export declare function getDaysElapsed(sowingDate: Date): number;
export declare function getAverageDailyGDD(accumulatedGDD: number, daysElapsed: number): number;
export declare function getAvailableCrops(): string[];
export declare function getAvailableUPCrops(): readonly string[];
export declare function getCropParameters(cropName: string): {
    baseTemp: number;
    upperTemp: number;
    requiredGDD: number;
} | null;
/**
 * Validate if crop is suitable for current temperature range
 */
export declare function isCropSuitableForTemperature(cropName: string, avgTemp: number, minTemp: number): TemperatureSuitability;
export declare function updateFieldGDD(fieldId: number, cropName: string, sowingDate: Date, tempMax: number, tempMin: number, prisma: PrismaClient): Promise<GDDUpdateResult>;
export declare function resetFieldGDD(fieldId: number, prisma: PrismaClient): Promise<void>;
//# sourceMappingURL=gddService.d.ts.map