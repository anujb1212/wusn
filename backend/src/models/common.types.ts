/**
 * Common Types for WUSN Backend
 *
 * All types aligned with 20-crop universe and gateway data contract
 * Gateway provides: nodeId, soilMoisture, soilTemperature, airTemperature, airHumidity, airPressure
 */

import type {
    CropName,
    GrowthStage,
    SoilTexture,
    IrrigationUrgency,
    IrrigationMethod,
    Season,
} from '../utils/constants.js';

/**
 * Raw sensor payload from gateway via MQTT
 *
 * Contract: Each gateway reading includes both soil and air measurements
 * - soilMoisture: Raw sensor value (to be calibrated to VWC%)
 * - soilTemperature: Soil temp at sensor depth (°C)
 * - airTemperature: Air temp for GDD and ET calculations (°C)
 * - airHumidity: Relative humidity (%)
 * - airPressure: Atmospheric pressure (hPa), optional
 */
export interface SensorPayload {
    nodeId: number;
    soilMoisture: number; // Raw value (calibrated to VWC in service)
    soilTemperature: number; // °C
    airTemperature: number; // °C - used for GDD calculation
    airHumidity: number; // %
    airPressure?: number; // hPa (optional)
    timestamp?: string; // ISO 8601 string, defaults to server time if missing
}

/**
 * Processed and validated sensor data
 * Post-calibration, ready for agronomic calculations
 */
export interface ProcessedSensorData {
    nodeId: number;
    soilMoistureVWC: number; // Calibrated volumetric water content (%)
    soilTemperature: number; // °C
    airTemperature: number; // °C - for GDD, ET calculations
    airHumidity: number; // %
    airPressure: number | null; // hPa
    timestamp: Date;
}

/**
 * Field configuration
 * Core entity linking physical field to crop, location, and agronomic state
 */
export interface FieldConfig {
    id: number;
    nodeId: number;
    gatewayId: string;
    fieldName: string;
    latitude: number; // Decimal degrees
    longitude: number; // Decimal degrees
    soilTexture: SoilTexture; // Default: SANDY_LOAM for Lucknow
    cropType: CropName | null; // Null until crop confirmed
    sowingDate: Date | null; // Null until crop confirmed
    expectedHarvestDate: Date | null;
    baseTemperature: number | null; // Tbase for GDD (°C)
    expectedGDDTotal: number | null; // Total GDD required
    accumulatedGDD: number; // Current GDD accumulated
    currentGrowthStage: GrowthStage | null;
    lastGDDUpdate: Date | null;
}

/**
 * Daily GDD calculation result
 * Formula: GDD = max(0, (Tmax + Tmin)/2 - Tbase)
 * Uses airTemperature from gateway readings aggregated daily
 */
export interface GDDResult {
    date: Date;
    dailyGDD: number; // Degree-days accumulated on this date
    cumulativeGDD: number; // Total GDD since sowing
    avgAirTemp: number; // Average air temperature (°C) for the day
    minAirTemp: number; // Min air temperature (°C) for the day
    maxAirTemp: number; // Max air temperature (°C) for the day
    growthStage: GrowthStage;
    readingsCount: number; // Number of gateway readings used
}

/**
 * GDD status summary for a field
 */
export interface GDDStatus {
    fieldId: number;
    nodeId: number;
    cropType: CropName | null;
    sowingDate: Date | null;
    accumulatedGDD: number;
    expectedGDDTotal: number | null;
    progressPercent: number; // (accumulatedGDD / expectedGDDTotal) * 100
    currentStage: GrowthStage;
    daysFromSowing: number;
    estimatedDaysToHarvest: number | null;
    lastUpdate: Date | null;
}

/**
 * Weather forecast daily entry (from external API like OpenWeather)
 */
export interface WeatherForecastDay {
    date: string; // YYYY-MM-DD
    tempMax: number; // °C
    tempMin: number; // °C
    tempAvg: number; // °C
    humidity: number; // %
    precipitation: number; // mm
    windSpeed?: number; // m/s (optional)
    description: string;
}

/**
 * Complete weather forecast
 */
export interface WeatherForecast {
    latitude: number;
    longitude: number;
    fetchedAt: Date;
    expiresAt: Date;
    forecast: WeatherForecastDay[];
}

/**
 * Crop scoring breakdown
 * Used by recommendation engine to rank crops
 */
export interface CropScore {
    cropName: CropName;
    totalScore: number; // 0-100
    rank: number; // 1-based rank
    scores: {
        moisture: number; // 0-30 (VWC suitability)
        temperature: number; // 0-25 (air temp suitability)
        season: number; // 0-20 (current season match)
        soil: number; // 0-15 (soil texture suitability)
        gddFeasibility: number; // 0-10 (can complete GDD before season end)
    };
    explanation: string; // Human-readable reason for score
    suitable: boolean; // totalScore >= 60 threshold
}

/**
 * Crop recommendation result
 */
export interface CropRecommendation {
    nodeId: number;
    fieldName: string;
    currentSeason: Season;
    recommendedCrop: CropName; // Top-ranked suitable crop
    topCrops: CropScore[]; // All 20 crops ranked
    conditions: {
        currentVWC: number; // Current soil moisture (%)
        currentAirTemp: number; // Current air temperature (°C)
        currentSoilTemp: number; // Current soil temperature (°C)
        soilTexture: SoilTexture;
        accumulatedGDD: number; // If crop already growing
    };
    timestamp: Date;
}

/**
 * Irrigation decision
 * Based on soil water balance, crop stage, and weather forecast
 *
 * Notes:
 * - suggestedDepthMm/duration should be 0 when decision == "do_not_irrigate".
 * - "applicationRateMmPerHour" is an explicit assumption used to convert depth -> time.
 */
export interface IrrigationDecision {
    nodeId: number;
    fieldName: string;

    // Machine key (UI should map to labels)
    decision: 'irrigate_now' | 'irrigate_soon' | 'do_not_irrigate';

    urgency: IrrigationUrgency;
    urgencyScore: number; // 0-100 (0=none, 100=critical)

    // Human-readable explanation (English/Hindi can be added later as separate fields)
    reason: string;

    // Moisture state
    currentVWC: number; // Current VWC (%)
    targetVWC: number; // Target VWC based on crop/stage (%)

    // VWC points below target (0 if at/above target)
    deficit: number;

    // Optional explicit percent deficit relative to target (for UI clarity)
    deficitPctOfTarget?: number;

    // Irrigation recommendation (mm + minutes)
    suggestedDepthMm: number; // Irrigation depth (mm)
    suggestedDurationMin: number | null; // Duration estimate based on application rate

    // Optional transparency fields (so values are not "mysterious" in the UI)
    applicationRateMmPerHour?: number | null; // Depth->time assumption
    applicationRateSource?: 'field_config' | 'default' | 'unknown';
    scoreBasis?: string | null; // Short explanation of how urgencyScore was assigned (rule/threshold)

    // Optional method (future: from field config; kept optional for backward compatibility)
    recommendedMethod?: IrrigationMethod | null;

    cropType: CropName | null;
    growthStage: GrowthStage | null;

    weatherAdjustment: string | null; // e.g., "Delayed due to forecast rain"
    nextCheckHours: number; // When to re-evaluate
    timestamp: Date;
}

/**
 * Soil water balance
 * FAO-56 style water accounting for irrigation decisions
 *
 * Formulas:
 * - TAW = (FC - PWP) / 100 * rootDepth(cm) * 10  [mm]
 * - RAW = TAW * MAD  [mm]
 * - currentDepth = currentVWC / 100 * rootDepth(cm) * 10  [mm]
 * - depletion = (FC_depth - currentDepth) / TAW * 100  [%]
 */
export interface SoilWaterBalance {
    soilTexture: SoilTexture;
    rootDepthCm: number; // Crop-specific root zone depth (cm)
    fieldCapacity: number; // FC (VWC %)
    wiltingPoint: number; // PWP (VWC %)
    saturation: number; // Saturation point (VWC %)
    taw: number; // Total Available Water (mm)
    raw: number; // Readily Available Water (mm)
    mad: number; // Management Allowed Depletion (fraction 0-1)
    currentVWC: number; // Current VWC (%)
    currentDepth: number; // Current water depth in root zone (mm)
    depletionPercent: number; // Depletion as % of TAW
    stressLevel: 'none' | 'mild' | 'moderate' | 'severe'; // Based on depletion vs MAD
}

/**
 * Reference ET calculation result
 * Simplified Hargreaves method: ET0 = 0.0023 * (Tavg + 17.8) * (Tmax - Tmin)^0.5
 * Uses airTemperature data from gateway
 */
export interface ETCalculation {
    date: Date;
    et0: number; // Reference evapotranspiration (mm/day)
    tavg: number; // Average air temperature (°C)
    tmax: number; // Max air temperature (°C)
    tmin: number; // Min air temperature (°C)
    cropKc: number; // Crop coefficient (growth stage dependent)
    etc: number; // Crop evapotranspiration = ET0 * Kc (mm/day)
}

/**
 * Irrigation event record
 * Logged when irrigation is applied (manual or automated)
 */
export interface IrrigationEvent {
    id: number;
    fieldId: number;
    nodeId: number;
    appliedAt: Date;
    depthMm: number; // Water applied (mm)
    durationMin: number; // Duration (minutes)
    method: IrrigationMethod;
    triggeredBy: 'manual' | 'automated' | 'scheduled';
    vwcBefore: number; // VWC before irrigation (%)
    vwcAfter: number | null; // VWC after irrigation (%), null if not measured
    notes: string | null;
}

/**
 * Calibration parameters for soil moisture sensor
 * Linear calibration: VWC = slope * rawValue + intercept
 */
export interface SensorCalibration {
    nodeId: number;
    slope: number; // Calibration slope
    intercept: number; // Calibration intercept
    minRaw: number; // Min expected raw value
    maxRaw: number; // Max expected raw value
    calibratedAt: Date;
    notes: string | null;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
    error: string;
    message: string;
    statusCode: number;
    timestamp: Date;
    path?: string;
    details?: unknown;
}

/**
 * Success response wrapper
 */
export interface SuccessResponse<T = unknown> {
    success: true;
    data: T;
    timestamp: Date;
    message?: string;
}
