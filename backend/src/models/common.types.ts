// src/models/common.types.ts
/**
 * Common Types for WUSN Backend
 */

import type {
    UPCropName,
    GrowthStage,
    SoilTexture,
    IrrigationUrgency,
    IrrigationMethod,
    Season,
} from '../utils/constants.js';

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
    date: string;           // YYYY-MM-DD
    tempMax: number;        // °C
    tempMin: number;        // °C
    tempAvg: number;        // °C
    humidity: number;       // %
    precipitation: number;  // mm
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
    totalScore: number;        // 0-100
    rank: number;
    scores: {
        moisture: number;        // 0-25
        temperature: number;     // 0-25
        season: number;          // 0-25
        soil: number;            // 0-15
        gddFeasibility: number;  // 0-10
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
    urgencyScore: number;        // 0-100
    reason: string;
    currentVWC: number;
    targetVWC: number;
    deficit: number;             // VWC points below target
    suggestedDepthMm: number;    // Irrigation depth in mm
    suggestedDurationMin: number | null; // Duration estimate
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
    fieldCapacity: number;      // VWC %
    wiltingPoint: number;       // VWC %
    taw: number;                // Total Available Water (mm)
    raw: number;                // Readily Available Water (mm)
    currentVWC: number;         // Current VWC %
    currentDepth: number;       // Water depth (mm)
    depletion: number;          // % of TAW depleted
    mad: number;                // Management Allowed Depletion
}
