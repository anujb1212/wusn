import { PrismaClient } from '@prisma/client';
import { getLatestGDDStatus, type GrowthStage } from './gddService.js';
import type { WeatherData } from './weatherService.js';

const prisma = new PrismaClient();

const SANDY_LOAM_PARAMS = {
    fieldCapacity: 40,
    wiltingPoint: 8,
    saturation: 45,
    bulkDensity: 1.5,
    rootingDepth: 60,
};

const MAD_BY_STAGE: { [key in GrowthStage]: number } = {
    INITIAL: 0.5,
    DEVELOPMENT: 0.4,
    MID_SEASON: 0.3,
    LATE_SEASON: 0.5,
    HARVEST_READY: 0.7,
};

interface MoistureRequirement {
    min: number;
    optimal: number;
    max: number;
    criticalStages: GrowthStage[];
}

const CROP_MOISTURE_REQUIREMENTS: { [key: string]: MoistureRequirement } = {
    rice: {
        min: 60,
        optimal: 70,
        max: 80,
        criticalStages: ['MID_SEASON', 'LATE_SEASON'],
    },
    wheat: {
        min: 30,
        optimal: 40,
        max: 50,
        criticalStages: ['MID_SEASON'],
    },
    chickpea: {
        min: 25,
        optimal: 35,
        max: 45,
        criticalStages: ['MID_SEASON'],
    },
    lentil: {
        min: 25,
        optimal: 35,
        max: 45,
        criticalStages: ['MID_SEASON'],
    },
    cotton: {
        min: 35,
        optimal: 45,
        max: 55,
        criticalStages: ['MID_SEASON', 'LATE_SEASON'],
    },
    maize: {
        min: 40,
        optimal: 50,
        max: 60,
        criticalStages: ['MID_SEASON'],
    },
    pigeonpeas: {
        min: 30,
        optimal: 40,
        max: 50,
        criticalStages: ['MID_SEASON'],
    },
    mothbeans: {
        min: 20,
        optimal: 30,
        max: 40,
        criticalStages: ['MID_SEASON'],
    },
    mungbean: {
        min: 30,
        optimal: 40,
        max: 50,
        criticalStages: ['MID_SEASON'],
    },
    blackgram: {
        min: 30,
        optimal: 40,
        max: 50,
        criticalStages: ['MID_SEASON'],
    },
    kidneybeans: {
        min: 35,
        optimal: 45,
        max: 55,
        criticalStages: ['MID_SEASON'],
    },
};


export interface IrrigationDecision {
    shouldIrrigate: boolean;
    reason: string;
    currentVWC: number;
    targetVWC: number;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    estimatedWaterNeeded: number;
    recommendedMethod?: 'drip' | 'sprinkler' | 'flood';
    durationMinutes?: number;
    nextCheckHours: number;
    confidence: number;
    ruleTriggered: string;
    growthStage?: string;
    weatherConsideration?: string;
}

export async function makeIrrigationDecision(
    nodeId: number,
    weatherData?: WeatherData
): Promise<IrrigationDecision> {
    try {
        console.log(`[Irrigation] 💧 Evaluating irrigation need for node ${nodeId}`);

        const latestReading = await prisma.sensorReading.findFirst({
            where: { nodeId },
            orderBy: { timestamp: 'desc' },
        });

        if (!latestReading || latestReading.soilMoistureVWC === null) {
            throw new Error(`No soil moisture data available for node ${nodeId}`);
        }

        const currentVWC = latestReading.soilMoistureVWC;

        const gddStatus = await getLatestGDDStatus(nodeId);
        const fieldConfig = gddStatus.fieldConfig;

        if (!fieldConfig || !fieldConfig.cropType) {
            throw new Error(`No crop configured for node ${nodeId}`);
        }

        const cropType = fieldConfig.cropType;
        const growthStage: GrowthStage =
            (gddStatus.latestGDD?.growthStage as GrowthStage) || 'INITIAL';

        console.log(
            `[Irrigation] Crop: ${cropType}, Stage: ${growthStage}, Current VWC: ${currentVWC.toFixed(2)}%`
        );

        const moistureReq = getCropMoistureRequirement(cropType, growthStage);
        const targetVWC = moistureReq.target;
        const criticalVWC = moistureReq.critical;

        const FC = SANDY_LOAM_PARAMS.fieldCapacity;
        const WP = SANDY_LOAM_PARAMS.wiltingPoint;
        const MAD = moistureReq.mad;
        const RAW_threshold = FC - (FC - WP) * MAD;

        console.log(
            `[Irrigation] Target: ${targetVWC.toFixed(1)}%, RAW: ${RAW_threshold.toFixed(1)}%, Critical: ${criticalVWC.toFixed(1)}%`
        );

        // RULE 1: CRITICAL
        if (currentVWC <= criticalVWC) {
            const waterNeeded = calculateWaterNeeded(currentVWC, targetVWC, cropType, growthStage);

            await logIrrigationDecision(
                nodeId,
                true,
                'CRITICAL',
                currentVWC,
                targetVWC,
                waterNeeded,
                cropType,
                growthStage
            );

            return {
                shouldIrrigate: true,
                reason: `CRITICAL: Soil moisture (${currentVWC.toFixed(1)}%) at or below critical threshold (${criticalVWC.toFixed(1)}%). Immediate irrigation required!`,
                currentVWC,
                targetVWC,
                urgency: 'CRITICAL',
                estimatedWaterNeeded: waterNeeded,
                recommendedMethod: 'drip',
                durationMinutes: Math.round(waterNeeded * 3),
                nextCheckHours: 24,
                confidence: 0.95,
                ruleTriggered: 'CRITICAL_LOW_MOISTURE',
                growthStage,
            };
        }

        // RULE 2: HIGH
        if (currentVWC <= RAW_threshold) {
            const waterNeeded = calculateWaterNeeded(currentVWC, targetVWC, cropType, growthStage);

            await logIrrigationDecision(
                nodeId,
                true,
                'HIGH',
                currentVWC,
                targetVWC,
                waterNeeded,
                cropType,
                growthStage
            );

            return {
                shouldIrrigate: true,
                reason: `Soil moisture (${currentVWC.toFixed(1)}%) below RAW threshold (${RAW_threshold.toFixed(1)}%). Irrigation recommended.`,
                currentVWC,
                targetVWC,
                urgency: 'HIGH',
                estimatedWaterNeeded: waterNeeded,
                recommendedMethod: getRecommendedMethod(cropType, growthStage),
                durationMinutes: Math.round(waterNeeded * 2.5),
                nextCheckHours: 48,
                confidence: 0.9,
                ruleTriggered: 'BELOW_RAW_THRESHOLD',
                growthStage,
            };
        }

        // RULE 3: Weather check
        if (weatherData) {
            const rainForecast = getRainForecast(weatherData);

            if (rainForecast.expectedRain > 15 && currentVWC >= criticalVWC) {
                await logIrrigationDecision(
                    nodeId,
                    false,
                    'LOW',
                    currentVWC,
                    targetVWC,
                    0,
                    cropType,
                    growthStage
                );

                return {
                    shouldIrrigate: false,
                    reason: `Rain (${rainForecast.expectedRain.toFixed(1)} mm) expected in ${rainForecast.days} days. Current moisture adequate. Postpone irrigation.`,
                    currentVWC,
                    targetVWC,
                    urgency: 'LOW',
                    estimatedWaterNeeded: 0,
                    nextCheckHours: 72,
                    confidence: 0.85,
                    ruleTriggered: 'RAIN_FORECAST_ADEQUATE',
                    growthStage,
                    weatherConsideration: `${rainForecast.expectedRain.toFixed(1)} mm in ${rainForecast.days} days`,
                };
            }
        }

        // RULE 4: MEDIUM
        const isCriticalStage = moistureReq.criticalStages?.includes(growthStage);
        if (currentVWC < targetVWC && isCriticalStage) {
            const waterNeeded = calculateWaterNeeded(currentVWC, targetVWC, cropType, growthStage);

            await logIrrigationDecision(
                nodeId,
                true,
                'MEDIUM',
                currentVWC,
                targetVWC,
                waterNeeded,
                cropType,
                growthStage
            );

            return {
                shouldIrrigate: true,
                reason: `Critical stage (${growthStage}). Moisture (${currentVWC.toFixed(1)}%) below optimal (${targetVWC.toFixed(1)}%). Light irrigation recommended.`,
                currentVWC,
                targetVWC,
                urgency: 'MEDIUM',
                estimatedWaterNeeded: waterNeeded,
                recommendedMethod: getRecommendedMethod(cropType, growthStage),
                durationMinutes: Math.round(waterNeeded * 2),
                nextCheckHours: 72,
                confidence: 0.8,
                ruleTriggered: 'CRITICAL_STAGE_SUBOPTIMAL',
                growthStage,
            };
        }

        // RULE 5: At field capacity
        if (currentVWC >= FC) {
            await logIrrigationDecision(
                nodeId,
                false,
                'LOW',
                currentVWC,
                targetVWC,
                0,
                cropType,
                growthStage
            );

            return {
                shouldIrrigate: false,
                reason: `Soil at field capacity (${currentVWC.toFixed(1)}%). No irrigation needed.`,
                currentVWC,
                targetVWC,
                urgency: 'LOW',
                estimatedWaterNeeded: 0,
                nextCheckHours: 48,
                confidence: 0.95,
                ruleTriggered: 'AT_FIELD_CAPACITY',
                growthStage,
            };
        }

        // DEFAULT
        await logIrrigationDecision(nodeId, false, 'LOW', currentVWC, targetVWC, 0, cropType, growthStage);

        return {
            shouldIrrigate: false,
            reason: `Moisture (${currentVWC.toFixed(1)}%) adequate for ${growthStage}. Continue monitoring.`,
            currentVWC,
            targetVWC,
            urgency: 'LOW',
            estimatedWaterNeeded: 0,
            nextCheckHours: 24,
            confidence: 0.75,
            ruleTriggered: 'MOISTURE_ADEQUATE',
            growthStage,
        };
    } catch (error) {
        console.error(`[Irrigation] ❌ Error:`, error);
        throw error;
    }
}

function getCropMoistureRequirement(
    cropType: string,
    growthStage: GrowthStage
): {
    target: number;
    critical: number;
    mad: number;
    criticalStages?: GrowthStage[];
} {
    const normalizedCrop = cropType.toLowerCase().replace(/\s+/g, '');
    const baseReq = CROP_MOISTURE_REQUIREMENTS[normalizedCrop] || {
        min: 30,
        optimal: 40,
        max: 50,
        criticalStages: ['MID_SEASON'],
    };

    const stageAdjustments: { [key in GrowthStage]: number } = {
        INITIAL: 1.1,
        DEVELOPMENT: 1.0,
        MID_SEASON: 1.0,
        LATE_SEASON: 0.9,
        HARVEST_READY: 0.7,
    };

    const adjustment = stageAdjustments[growthStage] || 1.0;
    const mad = MAD_BY_STAGE[growthStage];

    return {
        target: baseReq.optimal * adjustment,
        critical: baseReq.min,
        mad,
        criticalStages: baseReq.criticalStages,
    };
}

function calculateWaterNeeded(
    currentVWC: number,
    targetVWC: number,
    cropType: string,
    growthStage: GrowthStage
): number {
    const rootDepth = getRootZoneDepth(cropType, growthStage);
    const deficit = Math.max(0, targetVWC - currentVWC);
    const waterNeeded = (deficit / 100) * rootDepth * 10;

    return Math.max(10, Math.min(50, Math.round(waterNeeded)));
}

function getRootZoneDepth(cropType: string, growthStage: GrowthStage): number {
    const depths: { [key: string]: { [key in GrowthStage]: number } } = {
        rice: {
            INITIAL: 15,
            DEVELOPMENT: 30,
            MID_SEASON: 40,
            LATE_SEASON: 40,
            HARVEST_READY: 40,
        },
        wheat: {
            INITIAL: 20,
            DEVELOPMENT: 40,
            MID_SEASON: 60,
            LATE_SEASON: 60,
            HARVEST_READY: 60,
        },
        chickpea: {
            INITIAL: 15,
            DEVELOPMENT: 30,
            MID_SEASON: 50,
            LATE_SEASON: 50,
            HARVEST_READY: 50,
        },
        maize: {
            INITIAL: 20,
            DEVELOPMENT: 40,
            MID_SEASON: 70,
            LATE_SEASON: 70,
            HARVEST_READY: 70,
        },
        cotton: {
            INITIAL: 20,
            DEVELOPMENT: 50,
            MID_SEASON: 100,
            LATE_SEASON: 100,
            HARVEST_READY: 100,
        },
    };

    const normalizedCrop = cropType.toLowerCase().replace(/\s+/g, '');
    return depths[normalizedCrop]?.[growthStage] || 50;
}

function getRecommendedMethod(cropType: string, growthStage: GrowthStage): 'drip' | 'sprinkler' | 'flood' {
    const normalizedCrop = cropType.toLowerCase().replace(/\s+/g, '');

    if (normalizedCrop === 'rice') {
        return 'flood';
    }

    if (growthStage === 'MID_SEASON' || growthStage === 'LATE_SEASON') {
        return 'drip';
    }

    return 'sprinkler';
}

function getRainForecast(weatherData: WeatherData): {
    expectedRain: number;
    days: number;
} {
    let totalRain = 0;
    const days = 3;

    if (weatherData.forecast_7day && weatherData.forecast_7day.length > 0) {
        for (let i = 0; i < Math.min(days, weatherData.forecast_7day.length); i++) {
            const dayForecast = weatherData.forecast_7day[i];
            totalRain += dayForecast?.precipitation_mm ?? 0;
        }
    }

    return { expectedRain: totalRain, days };
}

async function logIrrigationDecision(
    nodeId: number,
    shouldIrrigate: boolean,
    urgency: string,
    currentVWC: number,
    targetVWC: number,
    estimatedWaterNeeded: number,
    cropType: string,
    growthStage: GrowthStage | string
): Promise<void> {
    try {
        await prisma.irrigationLog.create({
            data: {
                nodeId,
                currentVWC,
                targetVWC,
                cropType,
                growthStage: String(growthStage),
                shouldIrrigate,
                urgency,
                reason: `Auto-decision: ${shouldIrrigate ? 'Irrigate' : 'Skip'}`,
                estimatedWaterNeeded,
            },
        });
    } catch (error) {
        console.error(`[Irrigation] Failed to log:`, error);
    }
}

export async function recordIrrigationAction(
    nodeId: number,
    waterAppliedMm: number
): Promise<void> {
    try {
        const latestLog = await prisma.irrigationLog.findFirst({
            where: { nodeId },
            orderBy: { timestamp: 'desc' },
        });

        if (latestLog) {
            await prisma.irrigationLog.update({
                where: { id: latestLog.id },
                data: {
                    actionTaken: true,
                    actionTimestamp: new Date(),
                    actualWaterApplied: waterAppliedMm,
                },
            });

            console.log(`[Irrigation] ✅ Recorded ${waterAppliedMm}mm for node ${nodeId}`);
        }
    } catch (error) {
        console.error(`[Irrigation] Failed to record action:`, error);
    }
}
