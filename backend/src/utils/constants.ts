// src/utils/constants.ts
/**
 * Application Constants
 */

/**
 * UP-Valid Crops (12 crops)
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
] as const;

export type UPCropName = typeof UP_VALID_CROPS[number];

/**
 * Seasons
 */
export const SEASONS = {
    KHARIF: 'KHARIF',
    RABI: 'RABI',
    ZAID: 'ZAID',
} as const;

export type Season = keyof typeof SEASONS;

/**
 * Growth Stages
 */
export const GROWTH_STAGES = {
    INITIAL: 'INITIAL',
    DEVELOPMENT: 'DEVELOPMENT',
    MID_SEASON: 'MID_SEASON',
    LATE_SEASON: 'LATE_SEASON',
    HARVEST_READY: 'HARVEST_READY',
} as const;

export type GrowthStage = keyof typeof GROWTH_STAGES;

/**
 * Soil Textures
 */
export const SOIL_TEXTURES = {
    SANDY: 'SANDY',
    SANDY_LOAM: 'SANDY_LOAM',
    LOAM: 'LOAM',
    CLAY_LOAM: 'CLAY_LOAM',
    CLAY: 'CLAY',
} as const;

export type SoilTexture = keyof typeof SOIL_TEXTURES;

/**
 * Irrigation Urgency
 */
export const IRRIGATION_URGENCY = {
    NONE: 'NONE',
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
} as const;

export type IrrigationUrgency = keyof typeof IRRIGATION_URGENCY;

/**
 * Irrigation Methods
 */
export const IRRIGATION_METHODS = {
    DRIP: 'drip',
    SPRINKLER: 'sprinkler',
    FLOOD: 'flood',
} as const;

export type IrrigationMethod = typeof IRRIGATION_METHODS[keyof typeof IRRIGATION_METHODS];

/**
 * Soil Water Constants (VWC %)
 */
export const SOIL_WATER_CONSTANTS = {
    SANDY_LOAM: {
        FIELD_CAPACITY: 42,
        WILTING_POINT: 12,
        SATURATION: 48,
    },
    LOAM: {
        FIELD_CAPACITY: 46,
        WILTING_POINT: 14,
        SATURATION: 52,
    },
    CLAY_LOAM: {
        FIELD_CAPACITY: 54,
        WILTING_POINT: 20,
        SATURATION: 60,
    },
} as const;

/**
 * Time Constants
 */
export const TIME_CONSTANTS = {
    MS_PER_SECOND: 1000,
    SECONDS_PER_MINUTE: 60,
    MINUTES_PER_HOUR: 60,
    HOURS_PER_DAY: 24,
    MS_PER_DAY: 86400000,
} as const;
