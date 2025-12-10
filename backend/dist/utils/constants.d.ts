/**
 * Application Constants with Agronomic Parameters
 * Sources: FAO CROPWAT, ICAR research, UP agricultural extension data
 */
/**
 * UP-Valid Crops (9 crops - Phase 4)
 */
export declare const UP_VALID_CROPS: readonly ["wheat", "rice", "maize", "chickpea", "lentil", "pea", "mustard", "sugarcane", "potato"];
export type UPCropName = typeof UP_VALID_CROPS[number];
/**
 * Seasons
 */
export declare const SEASONS: {
    readonly KHARIF: "KHARIF";
    readonly RABI: "RABI";
    readonly ZAID: "ZAID";
    readonly PERENNIAL: "PERENNIAL";
};
export type Season = keyof typeof SEASONS;
/**
 * Growth Stages
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
 * Irrigation Urgency
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
 * Soil Water Constants (VWC %)
 * Source: FAO-56 Table 19, adapted for Indian soils
 */
export declare const SOIL_WATER_CONSTANTS: {
    readonly SANDY: {
        readonly FIELD_CAPACITY: 15;
        readonly WILTING_POINT: 6;
        readonly SATURATION: 43;
        readonly TAW_PER_METER: 90;
    };
    readonly SANDY_LOAM: {
        readonly FIELD_CAPACITY: 22;
        readonly WILTING_POINT: 10;
        readonly SATURATION: 45;
        readonly TAW_PER_METER: 120;
    };
    readonly LOAM: {
        readonly FIELD_CAPACITY: 31;
        readonly WILTING_POINT: 15;
        readonly SATURATION: 47;
        readonly TAW_PER_METER: 160;
    };
    readonly CLAY_LOAM: {
        readonly FIELD_CAPACITY: 35;
        readonly WILTING_POINT: 20;
        readonly SATURATION: 49;
        readonly TAW_PER_METER: 150;
    };
    readonly CLAY: {
        readonly FIELD_CAPACITY: 39;
        readonly WILTING_POINT: 27;
        readonly SATURATION: 51;
        readonly TAW_PER_METER: 120;
    };
};
/**
 * Crop Parameters Database (9 UP-Valid Crops)
 */
export interface CropParameters {
    name: UPCropName;
    baseTemperature: number;
    totalGDD: number;
    optimalTempMin: number;
    optimalTempMax: number;
    vwcMin: number;
    vwcOptimal: number;
    vwcMax: number;
    preferredSoils: SoilTexture[];
    season: Season;
    rootDepth: number;
    mad: number;
    stages: {
        initial: number;
        development: number;
        midSeason: number;
        lateSeason: number;
    };
}
export declare const CROP_DATABASE: Record<UPCropName, CropParameters>;
/**
 * Season Detection (by month)
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
};
//# sourceMappingURL=constants.d.ts.map