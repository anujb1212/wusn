/**
 * Irrigation Decision Engine
 * Uses: Soil moisture + Weather forecast + GDD-based growth stage + Crop parameters
 */
import type { PrismaClient } from '@prisma/client';
import { type GrowthStage } from './gddService.js';
/**
 * Crop-specific parameters for North India
 * Kc = Crop coefficient (water requirement multiplier)
 */
export declare const CROP_PARAMETERS: {
    readonly wheat: {
        readonly name_hi: "गेहूं";
        readonly name_en: "Wheat";
        readonly season: "RABI";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.3;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 85;
                readonly duration_days: 30;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.7;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 85;
                readonly duration_days: 40;
            };
            readonly MID_SEASON: {
                readonly Kc: 1.15;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 85;
                readonly duration_days: 50;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.5;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 80;
                readonly duration_days: 30;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.3;
                readonly min_moisture_pct: 40;
                readonly max_moisture_pct: 70;
                readonly duration_days: 10;
            };
        };
    };
    readonly rice: {
        readonly name_hi: "चावल";
        readonly name_en: "Rice";
        readonly season: "KHARIF";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.5;
                readonly min_moisture_pct: 75;
                readonly max_moisture_pct: 100;
                readonly duration_days: 30;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.8;
                readonly min_moisture_pct: 80;
                readonly max_moisture_pct: 100;
                readonly duration_days: 30;
            };
            readonly MID_SEASON: {
                readonly Kc: 1.2;
                readonly min_moisture_pct: 85;
                readonly max_moisture_pct: 100;
                readonly duration_days: 80;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.8;
                readonly min_moisture_pct: 75;
                readonly max_moisture_pct: 100;
                readonly duration_days: 30;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.5;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 90;
                readonly duration_days: 10;
            };
        };
    };
    readonly maize: {
        readonly name_hi: "मक्का";
        readonly name_en: "Maize";
        readonly season: "KHARIF";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.3;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 80;
                readonly duration_days: 25;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.7;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 85;
                readonly duration_days: 35;
            };
            readonly MID_SEASON: {
                readonly Kc: 1.2;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 85;
                readonly duration_days: 50;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.6;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 75;
                readonly duration_days: 30;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.4;
                readonly min_moisture_pct: 40;
                readonly max_moisture_pct: 70;
                readonly duration_days: 10;
            };
        };
    };
    readonly mustard: {
        readonly name_hi: "सरसों";
        readonly name_en: "Mustard";
        readonly season: "RABI";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.3;
                readonly min_moisture_pct: 45;
                readonly max_moisture_pct: 75;
                readonly duration_days: 30;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.6;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 80;
                readonly duration_days: 40;
            };
            readonly MID_SEASON: {
                readonly Kc: 1;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 80;
                readonly duration_days: 60;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.5;
                readonly min_moisture_pct: 45;
                readonly max_moisture_pct: 70;
                readonly duration_days: 30;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.3;
                readonly min_moisture_pct: 40;
                readonly max_moisture_pct: 65;
                readonly duration_days: 10;
            };
        };
    };
};
/**
 * Soil-specific water holding capacity
 */
export declare const SOIL_PARAMETERS: {
    readonly SANDY: {
        readonly fieldCapacity_pct: 15;
        readonly wiltingPoint_pct: 8;
        readonly rootingDepth_cm: 60;
    };
    readonly LOAM: {
        readonly fieldCapacity_pct: 25;
        readonly wiltingPoint_pct: 12;
        readonly rootingDepth_cm: 70;
    };
    readonly CLAY_LOAM: {
        readonly fieldCapacity_pct: 35;
        readonly wiltingPoint_pct: 18;
        readonly rootingDepth_cm: 80;
    };
};
/**
 * Irrigation decision thresholds
 */
export declare const IRRIGATION_THRESHOLDS: {
    readonly RAIN_FORECAST_THRESHOLD_MM: 20;
    readonly MOISTURE_CRITICAL_PCT: 40;
    readonly MOISTURE_OPTIMAL_PCT: 85;
    readonly CHECK_INTERVAL_HOURS: 24;
};
export interface IrrigationInput {
    fieldId: number;
    cropName: string;
    soilType: 'SANDY' | 'LOAM' | 'CLAY_LOAM';
    currentMoisturePct: number;
    currentTempC: number;
    latitude: number;
    longitude: number;
    sowingDate: Date;
    accumulatedGDD: number;
}
export interface IrrigationDecision {
    shouldIrrigate: boolean;
    recommendedDepthMm: number;
    reason_en: string;
    reason_hi: string;
    nextCheckHours: number;
    confidence: number;
    ruleTriggered: string;
    irrigationPattern?: {
        type: 'drip' | 'sprinkler' | 'flood' | 'skip';
        duration_minutes?: number;
        notes: string;
    };
    weatherForecast?: {
        next3DaysRainMm: number;
        avgTempNext7Days: number;
    };
    growthStageInfo?: {
        stage: GrowthStage;
        progress: number;
        Kc: number;
    };
}
/**
 * Make irrigation decision based on multiple factors
 *
 * @param input - All required input parameters
 * @param prisma - PrismaClient instance
 * @returns Irrigation decision with reasoning
 */
export declare function decideIrrigation(input: IrrigationInput, prisma: PrismaClient): Promise<IrrigationDecision>;
//# sourceMappingURL=irrigationEngine.d.ts.map