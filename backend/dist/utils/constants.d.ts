/**
 * Application Constants with Research-Backed Agronomic Parameters
 *
 * STRICT 20-CROP UNIVERSE for Lucknow, Uttar Pradesh, India
 * All crop recommendation, irrigation, and GDD logic restricted to these crops only.
 *
 * Data Sources:
 * - FAO Irrigation and Drainage Paper 56 (FAO-56)
 * - FAO CROPWAT database
 * - ICAR (Indian Council of Agricultural Research) publications
 * - Paredes et al. (2025) - Growing Degree Days research
 * - UP Agricultural Extension data
 * - Field observations from Lucknow region (sandy loam soil)
 *
 * UPDATED: Dec 11, 2025 - Aligned with new Prisma CropParameters schema
 * Changes: moistureMin/Optimal/Max → vwcMin/Optimal/Max
 *          optimalTempMin/Max → soilTempMin/Optimal/Max
 *          stages.initial/development/midSeason/lateSeason → initialStageGDD/developmentStageGDD/midSeasonGDD/lateSeasonGDD
 */
/**
 * FIXED 20-CROP UNIVERSE
 * Field crops/staples (9): wheat, rice, maize, chickpea, lentil, pea, mustard, sugarcane, potato
 * Vegetables/leafy/cucurbits (11): radish, carrot, tomato, spinach, mint, cucumber, watermelon, musk melon, bottle gourd, bitter gourd
 */
export declare const VALID_CROPS: readonly ["wheat", "rice", "maize", "chickpea", "lentil", "pea", "mustard", "sugarcane", "potato", "radish", "carrot", "tomato", "spinach", "mint", "cucumber", "watermelon", "musk_melon", "bottle_gourd", "bitter_gourd"];
export type CropName = typeof VALID_CROPS[number];
/**
 * Seasons (Lucknow, Uttar Pradesh, India)
 */
export declare const SEASONS: {
    readonly KHARIF: "KHARIF";
    readonly RABI: "RABI";
    readonly ZAID: "ZAID";
    readonly PERENNIAL: "PERENNIAL";
};
export type Season = keyof typeof SEASONS;
/**
 * Growth Stages (based on GDD progress)
 */
export declare const GROWTH_STAGES: {
    readonly INITIAL: "INITIAL";
    readonly DEVELOPMENT: "DEVELOPMENT";
    readonly MID_SEASON: "MID_SEASON";
    readonly LATE_SEASON: "LATE_SEASON";
    readonly HARVEST_READY: "HARVEST_READY";
};
export type GrowthStage = keyof typeof GROWTH_STAGES;
/**
 * Soil Textures
 */
export declare const SOIL_TEXTURES: {
    readonly SANDY: "SANDY";
    readonly SANDY_LOAM: "SANDY_LOAM";
    readonly LOAM: "LOAM";
    readonly CLAY_LOAM: "CLAY_LOAM";
    readonly CLAY: "CLAY";
};
export type SoilTexture = keyof typeof SOIL_TEXTURES;
/**
 * Irrigation Urgency Levels
 */
export declare const IRRIGATION_URGENCY: {
    readonly NONE: "NONE";
    readonly LOW: "LOW";
    readonly MODERATE: "MODERATE";
    readonly HIGH: "HIGH";
    readonly CRITICAL: "CRITICAL";
};
export type IrrigationUrgency = keyof typeof IRRIGATION_URGENCY;
/**
 * Irrigation Methods
 */
export declare const IRRIGATION_METHODS: {
    readonly DRIP: "drip";
    readonly SPRINKLER: "sprinkler";
    readonly FLOOD: "flood";
};
export type IrrigationMethod = typeof IRRIGATION_METHODS[keyof typeof IRRIGATION_METHODS];
/**
 * Soil Water Constants by Texture (VWC %)
 * Source: FAO-56 Table 19, adapted for Indian soils
 *
 * FIELD_CAPACITY: VWC% at which soil holds max water after drainage
 * WILTING_POINT: VWC% below which plants cannot extract water
 * SATURATION: VWC% when all pores filled with water
 * TAW_PER_METER: Total Available Water (mm/m of soil depth)
 */
export declare const SOIL_WATER_CONSTANTS: {
    readonly SANDY: {
        readonly FIELD_CAPACITY: 15;
        readonly WILTING_POINT: 6;
        readonly SATURATION: 43;
        readonly TAW_PER_METER: 90;
        readonly P_FACTOR: 0.5;
    };
    readonly SANDY_LOAM: {
        readonly FIELD_CAPACITY: 22;
        readonly WILTING_POINT: 10;
        readonly SATURATION: 45;
        readonly TAW_PER_METER: 120;
        readonly P_FACTOR: 0.55;
    };
    readonly LOAM: {
        readonly FIELD_CAPACITY: 31;
        readonly WILTING_POINT: 15;
        readonly SATURATION: 47;
        readonly TAW_PER_METER: 160;
        readonly P_FACTOR: 0.5;
    };
    readonly CLAY_LOAM: {
        readonly FIELD_CAPACITY: 35;
        readonly WILTING_POINT: 20;
        readonly SATURATION: 49;
        readonly TAW_PER_METER: 150;
        readonly P_FACTOR: 0.45;
    };
    readonly CLAY: {
        readonly FIELD_CAPACITY: 39;
        readonly WILTING_POINT: 27;
        readonly SATURATION: 51;
        readonly TAW_PER_METER: 120;
        readonly P_FACTOR: 0.45;
    };
};
/**
 * Crop Coefficient (Kc) Values Interface
 * Source: FAO-56 Table 12
 */
export interface CropKcValues {
    ini: number;
    mid: number;
    end: number;
}
/**
 * Crop Parameters Interface
 * ALIGNED WITH PRISMA SCHEMA (Dec 11, 2025)
 */
export interface CropParameters {
    name: CropName;
    scientificName: string;
    season: Season;
    baseTemp: number;
    soilTempMin: number;
    soilTempOptimal: number;
    soilTempMax: number;
    vwcMin: number;
    vwcOptimal: number;
    vwcMax: number;
    rootDepthCm: number;
    mad: number;
    kc: CropKcValues;
    initialStageGDD: number;
    developmentStageGDD: number;
    midSeasonGDD: number;
    lateSeasonGDD: number;
    preferredSoils: SoilTexture[];
}
/**
 * CROP DATABASE (20 Crops Only)
 *
 * Research sources:
 * - Paredes et al. (2025): Base temperatures and GDD for vegetables/field crops
 * - FAO-56: Root depths, MAD values, crop coefficients
 * - Cultivation technology studies for cucurbits (India)
 *
 * UPDATED: Dec 11, 2025 - All field names aligned with Prisma schema
 */
export declare const CROP_DATABASE: Record<CropName, CropParameters>;
/**
 * Season Detection for Lucknow, UP (by month)
 * Kharif: Jun-Oct (monsoon)
 * Rabi: Nov-Feb (winter)
 * Zaid: Mar-May (summer)
 */
export declare function getCurrentSeason(date?: Date): Season;
/**
 * Time Constants
 */
export declare const TIME_CONSTANTS: {
    readonly MS_PER_SECOND: 1000;
    readonly SECONDS_PER_MINUTE: 60;
    readonly MINUTES_PER_HOUR: 60;
    readonly HOURS_PER_DAY: 24;
    readonly MS_PER_DAY: 86400000;
};
/**
 * Weather API Constants
 */
export declare const WEATHER_CONSTANTS: {
    readonly CACHE_TTL_HOURS: 1;
    readonly FORECAST_DAYS: 5;
    readonly API_TIMEOUT_MS: 5000;
};
/**
 * Irrigation Decision Constants
 */
export declare const IRRIGATION_CONSTANTS: {
    readonly RAIN_THRESHOLD_MM: 5;
    readonly RAIN_FORECAST_HOURS: 48;
    readonly MIN_IRRIGATION_DEPTH_MM: 15;
    readonly MAX_IRRIGATION_DEPTH_MM: 75;
    readonly APPLICATION_EFFICIENCY: 0.85;
};
//# sourceMappingURL=constants.d.ts.map