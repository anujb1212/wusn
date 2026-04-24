import type { CropName, GrowthStage, SoilTexture, IrrigationUrgency, IrrigationMethod, Season } from '../utils/constants.js';
export interface SensorPayload {
    nodeId: number;
    soilMoisture: number;
    soilTemperature: number;
    airTemperature: number;
    airHumidity: number;
    airPressure?: number;
    timestamp?: string;
}
export interface ProcessedSensorData {
    nodeId: number;
    soilMoistureVWC: number;
    soilTemperature: number;
    airTemperature: number;
    airHumidity?: number;
    airPressure?: number | null;
    timestamp?: Date;
}
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
export interface WeatherForecast {
    latitude: number;
    longitude: number;
    fetchedAt: Date;
    expiresAt: Date;
    forecast: WeatherForecastDay[];
}
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
    deficitPctOfTarget?: number;
    suggestedDepthMm: number;
    suggestedDurationMin: number | null;
    applicationRateMmPerHour?: number | null;
    applicationRateSource?: 'field_config' | 'default' | 'unknown';
    scoreBasis?: string | null;
    recommendedMethod?: IrrigationMethod | null;
    cropType: CropName | null;
    growthStage: GrowthStage | null;
    weatherAdjustment: string | null;
    nextCheckHours: number;
    timestamp: Date;
}
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
export interface ETCalculation {
    date: Date;
    et0: number;
    tavg: number;
    tmax: number;
    tmin: number;
    cropKc: number;
    etc: number;
}
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
export interface SensorCalibration {
    nodeId: number;
    slope: number;
    intercept: number;
    minRaw: number;
    maxRaw: number;
    calibratedAt: Date;
    notes: string | null;
}
export interface ErrorResponse {
    error: string;
    message: string;
    statusCode: number;
    timestamp: Date;
    path?: string;
    details?: unknown;
}
export interface SuccessResponse<T = unknown> {
    success: true;
    data: T;
    timestamp: Date;
    message?: string;
}
//# sourceMappingURL=common.types.d.ts.map