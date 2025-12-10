/**
 * Application Constants with Agronomic Parameters
 * Sources: FAO CROPWAT, ICAR research, UP agricultural extension data
 */
/**
 * UP-Valid Crops (9 crops - Phase 4)
 */
export const UP_VALID_CROPS = [
    'wheat',
    'rice',
    'maize',
    'chickpea',
    'lentil',
    'pea',
    'mustard',
    'sugarcane',
    'potato',
];
/**
 * Seasons
 */
export const SEASONS = {
    KHARIF: 'KHARIF', // Jun-Oct (monsoon)
    RABI: 'RABI', // Nov-Mar (winter)
    ZAID: 'ZAID', // Mar-Jun (summer)
    PERENNIAL: 'PERENNIAL', // Year-round
};
/**
 * Growth Stages
 */
export const GROWTH_STAGES = {
    INITIAL: 'INITIAL',
    DEVELOPMENT: 'DEVELOPMENT',
    MID_SEASON: 'MID_SEASON',
    LATE_SEASON: 'LATE_SEASON',
    HARVEST_READY: 'HARVEST_READY',
};
/**
 * Soil Textures
 */
export const SOIL_TEXTURES = {
    SANDY: 'SANDY',
    SANDY_LOAM: 'SANDY_LOAM',
    LOAM: 'LOAM',
    CLAY_LOAM: 'CLAY_LOAM',
    CLAY: 'CLAY',
};
/**
 * Irrigation Urgency
 */
export const IRRIGATION_URGENCY = {
    NONE: 'NONE',
    LOW: 'LOW',
    MODERATE: 'MODERATE',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
};
/**
 * Irrigation Methods
 */
export const IRRIGATION_METHODS = {
    DRIP: 'drip',
    SPRINKLER: 'sprinkler',
    FLOOD: 'flood',
};
/**
 * Soil Water Constants (VWC %)
 * Source: FAO-56 Table 19, adapted for Indian soils
 */
export const SOIL_WATER_CONSTANTS = {
    SANDY: {
        FIELD_CAPACITY: 15,
        WILTING_POINT: 6,
        SATURATION: 43,
        TAW_PER_METER: 90,
    },
    SANDY_LOAM: {
        FIELD_CAPACITY: 22,
        WILTING_POINT: 10,
        SATURATION: 45,
        TAW_PER_METER: 120,
    },
    LOAM: {
        FIELD_CAPACITY: 31,
        WILTING_POINT: 15,
        SATURATION: 47,
        TAW_PER_METER: 160,
    },
    CLAY_LOAM: {
        FIELD_CAPACITY: 35,
        WILTING_POINT: 20,
        SATURATION: 49,
        TAW_PER_METER: 150,
    },
    CLAY: {
        FIELD_CAPACITY: 39,
        WILTING_POINT: 27,
        SATURATION: 51,
        TAW_PER_METER: 120,
    },
};
export const CROP_DATABASE = {
    wheat: {
        name: 'wheat',
        baseTemperature: 5,
        totalGDD: 1800,
        optimalTempMin: 15,
        optimalTempMax: 25,
        vwcMin: 20,
        vwcOptimal: 27,
        vwcMax: 35,
        preferredSoils: ['LOAM', 'CLAY_LOAM', 'SANDY_LOAM'],
        season: 'RABI',
        rootDepth: 120,
        mad: 0.55,
        stages: {
            initial: 15,
            development: 35,
            midSeason: 70,
            lateSeason: 95,
        },
    },
    rice: {
        name: 'rice',
        baseTemperature: 10,
        totalGDD: 2000,
        optimalTempMin: 25,
        optimalTempMax: 35,
        vwcMin: 35,
        vwcOptimal: 40,
        vwcMax: 45,
        preferredSoils: ['CLAY_LOAM', 'CLAY', 'LOAM'],
        season: 'KHARIF',
        rootDepth: 50,
        mad: 0.20,
        stages: {
            initial: 12,
            development: 30,
            midSeason: 65,
            lateSeason: 90,
        },
    },
    maize: {
        name: 'maize',
        baseTemperature: 10,
        totalGDD: 1600,
        optimalTempMin: 20,
        optimalTempMax: 30,
        vwcMin: 22,
        vwcOptimal: 28,
        vwcMax: 35,
        preferredSoils: ['LOAM', 'SANDY_LOAM', 'CLAY_LOAM'],
        season: 'KHARIF',
        rootDepth: 120,
        mad: 0.55,
        stages: {
            initial: 10,
            development: 30,
            midSeason: 65,
            lateSeason: 90,
        },
    },
    chickpea: {
        name: 'chickpea',
        baseTemperature: 10,
        totalGDD: 1500,
        optimalTempMin: 20,
        optimalTempMax: 30,
        vwcMin: 18,
        vwcOptimal: 24,
        vwcMax: 30,
        preferredSoils: ['LOAM', 'CLAY_LOAM', 'SANDY_LOAM'],
        season: 'RABI',
        rootDepth: 100,
        mad: 0.50,
        stages: {
            initial: 15,
            development: 35,
            midSeason: 70,
            lateSeason: 95,
        },
    },
    lentil: {
        name: 'lentil',
        baseTemperature: 5,
        totalGDD: 1300,
        optimalTempMin: 18,
        optimalTempMax: 28,
        vwcMin: 18,
        vwcOptimal: 23,
        vwcMax: 28,
        preferredSoils: ['LOAM', 'SANDY_LOAM'],
        season: 'RABI',
        rootDepth: 80,
        mad: 0.50,
        stages: {
            initial: 15,
            development: 35,
            midSeason: 65,
            lateSeason: 90,
        },
    },
    pea: {
        name: 'pea',
        baseTemperature: 5,
        totalGDD: 1200,
        optimalTempMin: 15,
        optimalTempMax: 25,
        vwcMin: 18,
        vwcOptimal: 25,
        vwcMax: 32,
        preferredSoils: ['LOAM', 'CLAY_LOAM'],
        season: 'RABI',
        rootDepth: 90,
        mad: 0.45,
        stages: {
            initial: 15,
            development: 30,
            midSeason: 60,
            lateSeason: 85,
        },
    },
    mustard: {
        name: 'mustard',
        baseTemperature: 5,
        totalGDD: 1400,
        optimalTempMin: 15,
        optimalTempMax: 25,
        vwcMin: 18,
        vwcOptimal: 25,
        vwcMax: 32,
        preferredSoils: ['LOAM', 'CLAY_LOAM', 'SANDY_LOAM'],
        season: 'RABI',
        rootDepth: 100,
        mad: 0.50,
        stages: {
            initial: 15,
            development: 30,
            midSeason: 65,
            lateSeason: 90,
        },
    },
    sugarcane: {
        name: 'sugarcane',
        baseTemperature: 12,
        totalGDD: 4000,
        optimalTempMin: 25,
        optimalTempMax: 35,
        vwcMin: 35,
        vwcOptimal: 42,
        vwcMax: 50,
        preferredSoils: ['LOAM', 'CLAY_LOAM'],
        season: 'PERENNIAL',
        rootDepth: 150,
        mad: 0.65,
        stages: {
            initial: 20,
            development: 60,
            midSeason: 180,
            lateSeason: 240,
        },
    },
    potato: {
        name: 'potato',
        baseTemperature: 7,
        totalGDD: 1400,
        optimalTempMin: 15,
        optimalTempMax: 25,
        vwcMin: 20,
        vwcOptimal: 28,
        vwcMax: 36,
        preferredSoils: ['SANDY_LOAM', 'LOAM'],
        season: 'RABI',
        rootDepth: 60,
        mad: 0.35,
        stages: {
            initial: 12,
            development: 30,
            midSeason: 65,
            lateSeason: 90,
        },
    },
};
/**
 * Season Detection (by month)
 */
export function getCurrentSeason(date = new Date()) {
    const month = date.getMonth() + 1; // 1-12
    if (month >= 6 && month <= 10)
        return 'KHARIF'; // Jun-Oct
    if (month >= 3 && month <= 5)
        return 'ZAID'; // Mar-May
    return 'RABI'; // Nov-Feb
}
/**
 * Time Constants
 */
export const TIME_CONSTANTS = {
    MS_PER_SECOND: 1000,
    SECONDS_PER_MINUTE: 60,
    MINUTES_PER_HOUR: 60,
    HOURS_PER_DAY: 24,
    MS_PER_DAY: 86400000,
};
/**
 * Weather API Constants
 */
export const WEATHER_CONSTANTS = {
    CACHE_TTL_HOURS: 1,
    FORECAST_DAYS: 5,
    API_TIMEOUT_MS: 5000,
};
/**
 * Irrigation Decision Constants
 */
export const IRRIGATION_CONSTANTS = {
    RAIN_THRESHOLD_MM: 5,
    RAIN_FORECAST_HOURS: 48,
    MIN_IRRIGATION_DEPTH_MM: 15,
    MAX_IRRIGATION_DEPTH_MM: 75,
};
//# sourceMappingURL=constants.js.map