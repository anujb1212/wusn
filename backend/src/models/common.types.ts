// src/models/common.types.ts
/**
 * Common Types
 */

import type {
    UPCropName,
    GrowthStage,
    SoilTexture,
    IrrigationUrgency,
    IrrigationMethod
} from '../utils/constants.js';

/**
 * Sensor payload from MQTT (MINIMAL - only 2 fields)
 */
export interface SensorPayload {
    nodeId: number;
    moisture: number;
    temperature: number;
    timestamp?: string;
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
 * Field configuration
 */
export interface FieldConfig {
    nodeId: number;
    fieldName: string;
    cropType: UPCropName | null;
    sowingDate: Date | null;
    soilTexture: SoilTexture;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    latitude: number | null;
    longitude: number | null;
}

/**
 * GDD result
 */
export interface GDDResult {
    date: Date;
    dailyGDD: number;
    cumulativeGDD: number;
    avgSoilTemp: number;
    growthStage: GrowthStage;
    readingsCount: number;
}

/**
 * Weather data
 */
export interface WeatherData {
    current: {
        temp_c: number;
        humidity_pct: number;
        wind_speed_kmh: number;
        condition: string;
    };
    forecast_7day: Array<{
        date: string;
        temp_max_c: number;
        temp_min_c: number;
        precipitation_mm: number;
        description: string;
    }>;
}

/**
 * Irrigation decision
 */
export interface IrrigationDecision {
    shouldIrrigate: boolean;
    reason: string;
    currentVWC: number;
    targetVWC: number;
    urgency: IrrigationUrgency;
    estimatedWaterNeeded: number;
    recommendedMethod?: IrrigationMethod;
    nextCheckHours: number;
    confidence: number;
    ruleTriggered: string;
    growthStage?: GrowthStage;
}

/**
 * Crop suitability
 */
export interface CropSuitability {
    cropName: UPCropName;
    suitability: number;
    reason: string;
    moistureMatch: number;
    temperatureMatch: number;
    seasonMatch: number;
    soilMatch: boolean;
}

/**
 * Crop recommendation
 */
export interface CropRecommendation {
    bestCrop: UPCropName;
    confidence: number;
    allCrops: CropSuitability[];
    summary: string;
}
