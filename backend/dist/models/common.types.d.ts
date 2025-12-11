/**
 * Common Types for WUSN Backend
 *
 * All types aligned with 20-crop universe and gateway data contract
 * Gateway provides: nodeId, soilMoisture, soilTemperature, airTemperature, airHumidity, airPressure
 */
import type { CropName, GrowthStage, SoilTexture, IrrigationUrgency, IrrigationMethod, Season } from '../utils/constants.js';
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
    soilMoisture: number;
    soilTemperature: number;
    airTemperature: number;
    airHumidity: number;
    airPressure?: number;
    timestamp?: string;
}
/**
 * Processed and validated sensor data
 * Post-calibration, ready for agronomic calculations
 */
export interface ProcessedSensorData {
    nodeId: number;
    soilMoistureVWC: number;
    soilTemperature: number;
    airTemperature: number;
    airHumidity: number;
    airPressure: number | null;
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
    latitude: number;
    longitude: number;
    soilTexture: SoilTexture;
    cropType: CropName | null;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    accumulatedGDD: number;
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
    dailyGDD: number;
    cumulativeGDD: number;
    avgAirTemp: number;
    minAirTemp: number;
    maxAirTemp: number;
    growthStage: GrowthStage;
    readingsCount: number;
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
    progressPercent: number;
    currentStage: GrowthStage;
    daysFromSowing: number;
    estimatedDaysToHarvest: number | null;
    lastUpdate: Date | null;
}
/**
 * Weather forecast daily entry (from external API like OpenWeather)
 */
export interface WeatherForecastDay {
    date: string;
    tempMax: number;
    tempMin: number;
    tempAvg: number;
    humidity: number;
    precipitation: number;
    windSpeed?: number;
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
    totalScore: number;
    rank: number;
    scores: {
        moisture: number;
        temperature: number;
        season: number;
        soil: number;
        gddFeasibility: number;
    };
    explanation: string;
    suitable: boolean;
}
/**
 * Crop recommendation result
 */
export interface CropRecommendation {
    nodeId: number;
    fieldName: string;
    currentSeason: Season;
    recommendedCrop: CropName;
    topCrops: CropScore[];
    conditions: {
        currentVWC: number;
        currentAirTemp: number;
        currentSoilTemp: number;
        soilTexture: SoilTexture;
        accumulatedGDD: number;
    };
    timestamp: Date;
}
/**
 * Irrigation decision
 * Based on soil water balance, crop stage, and weather forecast
 */
export interface IrrigationDecision {
    nodeId: number;
    fieldName: string;
    decision: 'irrigate_now' | 'irrigate_soon' | 'do_not_irrigate';
    urgency: IrrigationUrgency;
    urgencyScore: number;
    reason: string;
    currentVWC: number;
    targetVWC: number;
    deficit: number;
    suggestedDepthMm: number;
    suggestedDurationMin: number | null;
    cropType: CropName | null;
    growthStage: GrowthStage | null;
    weatherAdjustment: string | null;
    nextCheckHours: number;
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
    rootDepthCm: number;
    fieldCapacity: number;
    wiltingPoint: number;
    saturation: number;
    taw: number;
    raw: number;
    mad: number;
    currentVWC: number;
    currentDepth: number;
    depletionPercent: number;
    stressLevel: 'none' | 'mild' | 'moderate' | 'severe';
}
/**
 * Reference ET calculation result
 * Simplified Hargreaves method: ET0 = 0.0023 * (Tavg + 17.8) * (Tmax - Tmin)^0.5
 * Uses airTemperature data from gateway
 */
export interface ETCalculation {
    date: Date;
    et0: number;
    tavg: number;
    tmax: number;
    tmin: number;
    cropKc: number;
    etc: number;
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
    depthMm: number;
    durationMin: number;
    method: IrrigationMethod;
    triggeredBy: 'manual' | 'automated' | 'scheduled';
    vwcBefore: number;
    vwcAfter: number | null;
    notes: string | null;
}
/**
 * Calibration parameters for soil moisture sensor
 * Linear calibration: VWC = slope * rawValue + intercept
 */
export interface SensorCalibration {
    nodeId: number;
    slope: number;
    intercept: number;
    minRaw: number;
    maxRaw: number;
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
//# sourceMappingURL=common.types.d.ts.map