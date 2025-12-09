/**
 * Common Types for WUSN Backend
 */
import type { UPCropName, GrowthStage, SoilTexture, IrrigationUrgency, Season } from '../utils/constants.js';
/**
 * Sensor payload from MQTT - soil measurements
 */
export interface SensorPayload {
    nodeId: number;
    moisture: number;
    temperature: number;
    timestamp?: string | undefined;
}
/**
 * Weather payload from MQTT - air measurements from gateway
 */
export interface WeatherPayload {
    gatewayId: string;
    airTemperature: number;
    humidity: number;
    pressure?: number | undefined;
    timestamp?: string | undefined;
}
/**
 * Processed sensor data
 */
export interface ProcessedSensorData {
    nodeId: number;
    soilMoistureVWC: number;
    soilTemperature: number;
    timestamp: Date;
}
/**
 * Field configuration (unified)
 */
export interface FieldConfig {
    id: number;
    nodeId: number;
    gatewayId: string;
    fieldName: string;
    latitude: number;
    longitude: number;
    soilTexture: SoilTexture;
    cropType: UPCropName | null;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    accumulatedGDD: number;
    currentGrowthStage: string | null;
    lastGDDUpdate: Date | null;
}
/**
 * Daily GDD calculation result
 */
export interface GDDResult {
    date: Date;
    dailyGDD: number;
    cumulativeGDD: number;
    avgAirTemp: number;
    growthStage: GrowthStage;
    readingsCount: number;
}
/**
 * GDD status for a field
 */
export interface GDDStatus {
    fieldId: number;
    nodeId: number;
    cropType: string | null;
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
 * Weather forecast daily entry
 */
export interface WeatherForecastDay {
    date: string;
    tempMax: number;
    tempMin: number;
    tempAvg: number;
    humidity: number;
    precipitation: number;
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
 */
export interface CropScore {
    cropName: UPCropName;
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
    recommendedCrop: UPCropName;
    topCrops: CropScore[];
    conditions: {
        currentVWC: number;
        currentSoilTemp: number;
        soilTexture: SoilTexture;
        accumulatedGDD: number;
    };
    timestamp: Date;
}
/**
 * Irrigation decision
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
    cropType: string | null;
    growthStage: GrowthStage | null;
    weatherAdjustment: string | null;
    nextCheckHours: number;
    timestamp: Date;
}
/**
 * Soil water balance
 */
export interface SoilWaterBalance {
    soilTexture: SoilTexture;
    fieldCapacity: number;
    wiltingPoint: number;
    taw: number;
    raw: number;
    currentVWC: number;
    currentDepth: number;
    depletion: number;
    mad: number;
}
//# sourceMappingURL=common.types.d.ts.map