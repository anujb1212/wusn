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
export const VALID_CROPS = [
    // Field crops / staples
    'wheat',
    'rice',
    'maize',
    'chickpea',
    'lentil',
    'pea',
    'mustard',
    'sugarcane',
    'potato',
    // Vegetables / leafy / cucurbits
    'radish',
    'carrot',
    'tomato',
    'spinach',
    'mint',
    'cucumber',
    'watermelon',
    'musk_melon',
    'bottle_gourd',
    'bitter_gourd',
];
/**
 * Seasons (Lucknow, Uttar Pradesh, India)
 */
export const SEASONS = {
    KHARIF: 'KHARIF', // Jun-Oct (monsoon season)
    RABI: 'RABI', // Nov-Mar (winter season)
    ZAID: 'ZAID', // Mar-Jun (summer season)
    PERENNIAL: 'PERENNIAL', // Year-round
};
/**
 * Growth Stages (based on GDD progress)
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
 * Irrigation Urgency Levels
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
 * Soil Water Constants by Texture (VWC %)
 * Source: FAO-56 Table 19, adapted for Indian soils
 *
 * FIELD_CAPACITY: VWC% at which soil holds max water after drainage
 * WILTING_POINT: VWC% below which plants cannot extract water
 * SATURATION: VWC% when all pores filled with water
 * TAW_PER_METER: Total Available Water (mm/m of soil depth)
 */
export const SOIL_WATER_CONSTANTS = {
    SANDY: {
        FIELD_CAPACITY: 15,
        WILTING_POINT: 6,
        SATURATION: 43,
        TAW_PER_METER: 90,
        P_FACTOR: 0.5, // fraction of TAW that can be depleted before stress
    },
    SANDY_LOAM: {
        FIELD_CAPACITY: 22,
        WILTING_POINT: 10,
        SATURATION: 45,
        TAW_PER_METER: 120,
        P_FACTOR: 0.55,
    },
    LOAM: {
        FIELD_CAPACITY: 31,
        WILTING_POINT: 15,
        SATURATION: 47,
        TAW_PER_METER: 160,
        P_FACTOR: 0.5,
    },
    CLAY_LOAM: {
        FIELD_CAPACITY: 35,
        WILTING_POINT: 20,
        SATURATION: 49,
        TAW_PER_METER: 150,
        P_FACTOR: 0.45,
    },
    CLAY: {
        FIELD_CAPACITY: 39,
        WILTING_POINT: 27,
        SATURATION: 51,
        TAW_PER_METER: 120,
        P_FACTOR: 0.45,
    },
};
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
export const CROP_DATABASE = {
    // ========================
    // FIELD CROPS / STAPLES
    // ========================
    wheat: {
        name: 'wheat',
        scientificName: 'Triticum aestivum',
        season: 'RABI',
        baseTemp: 0,
        soilTempMin: 4,
        soilTempOptimal: 25,
        soilTempMax: 35,
        vwcMin: 20,
        vwcOptimal: 30,
        vwcMax: 40,
        rootDepthCm: 120,
        mad: 0.55,
        kc: { ini: 0.3, mid: 1.15, end: 0.4 },
        initialStageGDD: 150,
        developmentStageGDD: 650,
        midSeasonGDD: 1350,
        lateSeasonGDD: 2100,
        preferredSoils: ['LOAM', 'CLAY_LOAM', 'SANDY_LOAM'],
    },
    rice: {
        name: 'rice',
        scientificName: 'Oryza sativa',
        season: 'KHARIF',
        baseTemp: 10,
        soilTempMin: 16,
        soilTempOptimal: 30,
        soilTempMax: 42,
        vwcMin: 35,
        vwcOptimal: 50,
        vwcMax: 60,
        rootDepthCm: 50,
        mad: 0.20,
        kc: { ini: 1.05, mid: 1.2, end: 0.75 },
        initialStageGDD: 180,
        developmentStageGDD: 800,
        midSeasonGDD: 1700,
        lateSeasonGDD: 2500,
        preferredSoils: ['CLAY_LOAM', 'CLAY', 'LOAM'],
    },
    maize: {
        name: 'maize',
        scientificName: 'Zea mays',
        season: 'KHARIF',
        baseTemp: 10,
        soilTempMin: 15,
        soilTempOptimal: 30,
        soilTempMax: 40,
        vwcMin: 22,
        vwcOptimal: 32,
        vwcMax: 42,
        rootDepthCm: 120,
        mad: 0.55,
        kc: { ini: 0.3, mid: 1.2, end: 0.6 },
        initialStageGDD: 120,
        developmentStageGDD: 650,
        midSeasonGDD: 1400,
        lateSeasonGDD: 2100,
        preferredSoils: ['LOAM', 'SANDY_LOAM', 'CLAY_LOAM'],
    },
    chickpea: {
        name: 'chickpea',
        scientificName: 'Cicer arietinum',
        season: 'RABI',
        baseTemp: 0,
        soilTempMin: 10,
        soilTempOptimal: 25,
        soilTempMax: 35,
        vwcMin: 18,
        vwcOptimal: 28,
        vwcMax: 38,
        rootDepthCm: 100,
        mad: 0.50,
        kc: { ini: 0.4, mid: 1.0, end: 0.35 },
        initialStageGDD: 100,
        developmentStageGDD: 500,
        midSeasonGDD: 1100,
        lateSeasonGDD: 1700,
        preferredSoils: ['LOAM', 'CLAY_LOAM', 'SANDY_LOAM'],
    },
    lentil: {
        name: 'lentil',
        scientificName: 'Lens culinaris',
        season: 'RABI',
        baseTemp: 0,
        soilTempMin: 8,
        soilTempOptimal: 22,
        soilTempMax: 32,
        vwcMin: 17,
        vwcOptimal: 27,
        vwcMax: 37,
        rootDepthCm: 90,
        mad: 0.50,
        kc: { ini: 0.4, mid: 1.05, end: 0.3 },
        initialStageGDD: 90,
        developmentStageGDD: 450,
        midSeasonGDD: 1000,
        lateSeasonGDD: 1550,
        preferredSoils: ['LOAM', 'SANDY_LOAM'],
    },
    pea: {
        name: 'pea',
        scientificName: 'Pisum sativum',
        season: 'RABI',
        baseTemp: 0,
        soilTempMin: 5,
        soilTempOptimal: 20,
        soilTempMax: 30,
        vwcMin: 20,
        vwcOptimal: 30,
        vwcMax: 40,
        rootDepthCm: 80,
        mad: 0.45,
        kc: { ini: 0.5, mid: 1.15, end: 0.35 },
        initialStageGDD: 80,
        developmentStageGDD: 400,
        midSeasonGDD: 900,
        lateSeasonGDD: 1400,
        preferredSoils: ['LOAM', 'CLAY_LOAM'],
    },
    mustard: {
        name: 'mustard',
        scientificName: 'Brassica juncea',
        season: 'RABI',
        baseTemp: 0,
        soilTempMin: 10,
        soilTempOptimal: 25,
        soilTempMax: 35,
        vwcMin: 22,
        vwcOptimal: 32,
        vwcMax: 42,
        rootDepthCm: 100,
        mad: 0.45,
        kc: { ini: 0.35, mid: 1.1, end: 0.35 },
        initialStageGDD: 100,
        developmentStageGDD: 500,
        midSeasonGDD: 1050,
        lateSeasonGDD: 1600,
        preferredSoils: ['LOAM', 'CLAY_LOAM', 'SANDY_LOAM'],
    },
    sugarcane: {
        name: 'sugarcane',
        scientificName: 'Saccharum officinarum',
        season: 'PERENNIAL',
        baseTemp: 10,
        soilTempMin: 20,
        soilTempOptimal: 32,
        soilTempMax: 40,
        vwcMin: 28,
        vwcOptimal: 38,
        vwcMax: 48,
        rootDepthCm: 120,
        mad: 0.65,
        kc: { ini: 0.4, mid: 1.25, end: 0.75 },
        initialStageGDD: 300,
        developmentStageGDD: 1500,
        midSeasonGDD: 4000,
        lateSeasonGDD: 6500,
        preferredSoils: ['LOAM', 'CLAY_LOAM'],
    },
    potato: {
        name: 'potato',
        scientificName: 'Solanum tuberosum',
        season: 'RABI',
        baseTemp: 7,
        soilTempMin: 10,
        soilTempOptimal: 20,
        soilTempMax: 30,
        vwcMin: 25,
        vwcOptimal: 35,
        vwcMax: 45,
        rootDepthCm: 50,
        mad: 0.35,
        kc: { ini: 0.5, mid: 1.15, end: 0.75 },
        initialStageGDD: 120,
        developmentStageGDD: 600,
        midSeasonGDD: 1200,
        lateSeasonGDD: 1800,
        preferredSoils: ['SANDY_LOAM', 'LOAM'],
    },
    // ========================================
    // VEGETABLES / LEAFY / CUCURBITS
    // ========================================
    radish: {
        name: 'radish',
        scientificName: 'Raphanus sativus',
        season: 'RABI',
        baseTemp: 4,
        soilTempMin: 8,
        soilTempOptimal: 20,
        soilTempMax: 30,
        vwcMin: 22,
        vwcOptimal: 32,
        vwcMax: 42,
        rootDepthCm: 40,
        mad: 0.40,
        kc: { ini: 0.5, mid: 0.9, end: 0.85 },
        initialStageGDD: 50,
        developmentStageGDD: 200,
        midSeasonGDD: 400,
        lateSeasonGDD: 600,
        preferredSoils: ['SANDY_LOAM', 'LOAM'],
    },
    carrot: {
        name: 'carrot',
        scientificName: 'Daucus carota',
        season: 'RABI',
        baseTemp: 4,
        soilTempMin: 8,
        soilTempOptimal: 22,
        soilTempMax: 32,
        vwcMin: 23,
        vwcOptimal: 33,
        vwcMax: 43,
        rootDepthCm: 60,
        mad: 0.35,
        kc: { ini: 0.35, mid: 1.0, end: 0.9 },
        initialStageGDD: 80,
        developmentStageGDD: 400,
        midSeasonGDD: 900,
        lateSeasonGDD: 1400,
        preferredSoils: ['SANDY_LOAM', 'LOAM'],
    },
    tomato: {
        name: 'tomato',
        scientificName: 'Solanum lycopersicum',
        season: 'RABI',
        baseTemp: 10,
        soilTempMin: 15,
        soilTempOptimal: 26,
        soilTempMax: 35,
        vwcMin: 25,
        vwcOptimal: 35,
        vwcMax: 45,
        rootDepthCm: 70,
        mad: 0.40,
        kc: { ini: 0.6, mid: 1.15, end: 0.8 },
        initialStageGDD: 150,
        developmentStageGDD: 700,
        midSeasonGDD: 1500,
        lateSeasonGDD: 2300,
        preferredSoils: ['LOAM', 'SANDY_LOAM'],
    },
    spinach: {
        name: 'spinach',
        scientificName: 'Spinacia oleracea',
        season: 'RABI',
        baseTemp: 5,
        soilTempMin: 8,
        soilTempOptimal: 20,
        soilTempMax: 30,
        vwcMin: 20,
        vwcOptimal: 30,
        vwcMax: 40,
        rootDepthCm: 40,
        mad: 0.35,
        kc: { ini: 0.5, mid: 1.0, end: 0.95 },
        initialStageGDD: 60,
        developmentStageGDD: 250,
        midSeasonGDD: 500,
        lateSeasonGDD: 750,
        preferredSoils: ['LOAM', 'SANDY_LOAM'],
    },
    mint: {
        name: 'mint',
        scientificName: 'Mentha spicata',
        season: 'PERENNIAL',
        baseTemp: 5,
        soilTempMin: 10,
        soilTempOptimal: 25,
        soilTempMax: 35,
        vwcMin: 28,
        vwcOptimal: 38,
        vwcMax: 48,
        rootDepthCm: 40,
        mad: 0.40,
        kc: { ini: 0.6, mid: 1.15, end: 1.1 },
        initialStageGDD: 80,
        developmentStageGDD: 350,
        midSeasonGDD: 800,
        lateSeasonGDD: 1250,
        preferredSoils: ['LOAM', 'SANDY_LOAM'],
    },
    cucumber: {
        name: 'cucumber',
        scientificName: 'Cucumis sativus',
        season: 'ZAID',
        baseTemp: 12,
        soilTempMin: 18,
        soilTempOptimal: 28,
        soilTempMax: 38,
        vwcMin: 24,
        vwcOptimal: 34,
        vwcMax: 44,
        rootDepthCm: 70,
        mad: 0.50,
        kc: { ini: 0.6, mid: 1.0, end: 0.75 },
        initialStageGDD: 100,
        developmentStageGDD: 450,
        midSeasonGDD: 900,
        lateSeasonGDD: 1300,
        preferredSoils: ['SANDY_LOAM', 'LOAM'],
    },
    watermelon: {
        name: 'watermelon',
        scientificName: 'Citrullus lanatus',
        season: 'ZAID',
        baseTemp: 12,
        soilTempMin: 18,
        soilTempOptimal: 30,
        soilTempMax: 40,
        vwcMin: 22,
        vwcOptimal: 32,
        vwcMax: 42,
        rootDepthCm: 100,
        mad: 0.40,
        kc: { ini: 0.4, mid: 1.0, end: 0.75 },
        initialStageGDD: 120,
        developmentStageGDD: 550,
        midSeasonGDD: 1150,
        lateSeasonGDD: 1700,
        preferredSoils: ['SANDY_LOAM', 'LOAM'],
    },
    musk_melon: {
        name: 'musk_melon',
        scientificName: 'Cucumis melo',
        season: 'ZAID',
        baseTemp: 12,
        soilTempMin: 18,
        soilTempOptimal: 28,
        soilTempMax: 38,
        vwcMin: 23,
        vwcOptimal: 33,
        vwcMax: 43,
        rootDepthCm: 90,
        mad: 0.45,
        kc: { ini: 0.5, mid: 1.05, end: 0.75 },
        initialStageGDD: 110,
        developmentStageGDD: 500,
        midSeasonGDD: 1050,
        lateSeasonGDD: 1550,
        preferredSoils: ['SANDY_LOAM', 'LOAM'],
    },
    bottle_gourd: {
        name: 'bottle_gourd',
        scientificName: 'Lagenaria siceraria',
        season: 'ZAID',
        baseTemp: 12,
        soilTempMin: 18,
        soilTempOptimal: 30,
        soilTempMax: 40,
        vwcMin: 24,
        vwcOptimal: 34,
        vwcMax: 44,
        rootDepthCm: 80,
        mad: 0.50,
        kc: { ini: 0.5, mid: 1.0, end: 0.8 },
        initialStageGDD: 100,
        developmentStageGDD: 480,
        midSeasonGDD: 1000,
        lateSeasonGDD: 1500,
        preferredSoils: ['SANDY_LOAM', 'LOAM'],
    },
    bitter_gourd: {
        name: 'bitter_gourd',
        scientificName: 'Momordica charantia',
        season: 'ZAID',
        baseTemp: 12,
        soilTempMin: 20,
        soilTempOptimal: 30,
        soilTempMax: 40,
        vwcMin: 24,
        vwcOptimal: 34,
        vwcMax: 44,
        rootDepthCm: 75,
        mad: 0.50,
        kc: { ini: 0.5, mid: 1.05, end: 0.85 },
        initialStageGDD: 110,
        developmentStageGDD: 500,
        midSeasonGDD: 1050,
        lateSeasonGDD: 1600,
        preferredSoils: ['SANDY_LOAM', 'LOAM'],
    },
};
/**
 * Season Detection for Lucknow, UP (by month)
 * Kharif: Jun-Oct (monsoon)
 * Rabi: Nov-Feb (winter)
 * Zaid: Mar-May (summer)
 */
export function getCurrentSeason(date = new Date()) {
    const month = date.getMonth() + 1; // 1-12
    if (month >= 6 && month <= 10)
        return 'KHARIF';
    if (month >= 3 && month <= 5)
        return 'ZAID';
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
    RAIN_THRESHOLD_MM: 5, // Minimum effective rainfall
    RAIN_FORECAST_HOURS: 48, // Look-ahead window for rain forecast
    MIN_IRRIGATION_DEPTH_MM: 15, // Minimum practical irrigation application
    MAX_IRRIGATION_DEPTH_MM: 75, // Maximum single irrigation event
    APPLICATION_EFFICIENCY: 0.85, // Drip system efficiency (adjust per method)
};
//# sourceMappingURL=constants.js.map