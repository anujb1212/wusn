/**
 * Irrigation Decision Service
 *
 * FAO-56 compliant soil water balance and irrigation scheduling
 *
 * Key formulas:
 * - TAW = (θFC - θWP) × Zr × 1000  [mm]
 * - RAW = p × TAW  [mm]
 * - Dr = Dr,i-1 - (P - RO) - I + ETc + DP  [mm]
 * - Ks = (TAW - Dr) / (TAW - RAW)  [stress coefficient]
 * - ETc = Kc × ET0  [mm/day]
 *
 * References:
 * - FAO Irrigation and Drainage Paper 56 (Allen et al., 1998)
 * - Chapter 8: ETc under soil water stress conditions
 * - Hargreaves equation for ET0 estimation
 *
 * Data sources:
 * - Current VWC from SensorReading.soilMoistureVWC
 * - Air temperature from SensorReading.airTemperature (for ET estimation)
 * - Weather forecast for rain adjustment
 * - Crop parameters from CROP_DATABASE (MAD, Kc, root depth)
 *
 * UPDATED: Dec 11, 2025 - Enhanced to use Kc values from new schema
 * UPDATED: Dec 13, 2025 - Depth/duration only for irrigate decisions, added
 *                            application rate + score basis metadata
 */

import { createLogger } from '../../config/logger.js';
import { prisma } from '../../config/database.js';
import {
    SOIL_WATER_CONSTANTS,
    CROP_DATABASE,
    IRRIGATION_URGENCY,
    IRRIGATION_CONSTANTS,
    GROWTH_STAGES,
} from '../../utils/constants.js';
import type { SoilTexture, CropName, GrowthStage, IrrigationUrgency } from '../../utils/constants.js';
import { getFieldByNodeId } from '../../repositories/field.repository.js';
import { getLatestReading } from '../../repositories/sensor.repository.js';
import { isRainExpected, estimateDailyET } from '../weather/weather.sevice.js';
import type { IrrigationDecision, SoilWaterBalance } from '../../models/common.types.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
import type { CropParameters as DbCropParameters } from '@prisma/client';

const logger = createLogger({ service: 'irrigation' });

type IrrigationCropParams = {
    name: string;
    vwcMin: number;
    vwcOptimal: number;
    vwcMax: number;
    rootDepthCm: number;
    mad: number;
    kc: { ini: number; mid: number; end: number };
    initialStageGDD: number;
    developmentStageGDD: number;
    midSeasonGDD: number;
    lateSeasonGDD: number;
};

function mapDbCropToIrrigationParams(crop: DbCropParameters): IrrigationCropParams {
    // Parse Kc JSON: expected shape { ini: number, mid: number, end: number }
    let kcValues = { ini: 0.5, mid: 1.0, end: 0.5 }; // safe defaults

    if (crop.kc && typeof crop.kc === 'object' && !Array.isArray(crop.kc)) {
        const parsed = crop.kc as Record<string, unknown>;
        kcValues = {
            ini: typeof parsed.ini === 'number' ? parsed.ini : 0.5,
            mid: typeof parsed.mid === 'number' ? parsed.mid : 1.0,
            end: typeof parsed.end === 'number' ? parsed.end : 0.5,
        };
    }

    return {
        name: crop.cropName,
        vwcMin: crop.vwcMin,
        vwcOptimal: crop.vwcOptimal,
        vwcMax: crop.vwcMax,
        rootDepthCm: crop.rootDepthCm,
        mad: crop.mad,
        kc: kcValues,
        initialStageGDD: crop.initialStageGDD,
        developmentStageGDD: crop.developmentStageGDD,
        midSeasonGDD: crop.midSeasonGDD,
        lateSeasonGDD: crop.lateSeasonGDD,
    };
}

/**
 * Get appropriate Kc value based on growth stage
 *
 * Uses crop coefficient curve from FAO-56:
 * - INITIAL: Kc.ini (low, sparse canopy)
 * - DEVELOPMENT: Linear interpolation between ini and mid
 * - MID_SEASON: Kc.mid (peak, full canopy)
 * - LATE_SEASON: Kc.end (declining, senescence)
 * - HARVEST_READY: Kc.end
 *
 * @param cropParams - Crop parameters with Kc values
 * @param growthStage - Current growth stage
 * @param accumulatedGDD - Current accumulated GDD
 * @returns Appropriate Kc value for current stage
 */
function getCurrentKc(
    cropParams: IrrigationCropParams,
    growthStage: GrowthStage | null,
    accumulatedGDD: number
): number {
    const { kc, initialStageGDD, developmentStageGDD, midSeasonGDD, lateSeasonGDD } = cropParams;

    // Default to initial if no stage specified
    if (!growthStage) {
        return kc.ini;
    }

    switch (growthStage) {
        case 'INITIAL':
            return kc.ini;

        case 'DEVELOPMENT': {
            // Linear interpolation between ini and mid based on GDD progress
            const stageStart = initialStageGDD;
            const stageEnd = developmentStageGDD;
            const stageProgress = (accumulatedGDD - stageStart) / (stageEnd - stageStart);
            const clampedProgress = Math.max(0, Math.min(1, stageProgress));
            return kc.ini + (kc.mid - kc.ini) * clampedProgress;
        }

        case 'MID_SEASON':
            return kc.mid;

        case 'LATE_SEASON':
        case 'HARVEST_READY': {
            // Linear interpolation between mid and end based on GDD progress
            const stageStart = midSeasonGDD;
            const stageEnd = lateSeasonGDD;
            const stageProgress = (accumulatedGDD - stageStart) / (stageEnd - stageStart);
            const clampedProgress = Math.max(0, Math.min(1, stageProgress));
            return kc.mid + (kc.end - kc.mid) * clampedProgress;
        }

        default:
            logger.warn({ growthStage }, 'Unknown growth stage, using initial Kc');
            return kc.ini;
    }
}

/**
 * Calculate soil water balance using FAO-56 methodology
 *
 * Formulas:
 * - TAW = (θFC - θWP) / 100 × Zr × 10  [mm]
 * - RAW = p × TAW  [mm, where p = MAD fraction]
 * - Current depth = currentVWC / 100 × Zr × 10  [mm]
 * - FC depth = θFC / 100 × Zr × 10  [mm]
 * - Depletion Dr = FC depth - current depth  [mm]
 * - Depletion % = (Dr / TAW) × 100
 *
 * @param soilTexture - Soil texture type (e.g., SANDY_LOAM)
 * @param currentVWC - Current volumetric water content (%)
 * @param rootDepthCm - Crop root zone depth (cm)
 * @param mad - Management allowed depletion fraction (0-1)
 * @returns SoilWaterBalance object with all water accounting parameters
 */
function calculateWaterBalance(
    soilTexture: SoilTexture,
    currentVWC: number,
    rootDepthCm: number,
    mad: number
): SoilWaterBalance {
    const soilParams = SOIL_WATER_CONSTANTS[soilTexture];

    if (!soilParams) {
        throw new ValidationError(`Invalid soil texture: ${soilTexture}`);
    }

    const fc = soilParams.FIELD_CAPACITY; // % VWC
    const pwp = soilParams.WILTING_POINT; // % VWC
    const saturation = soilParams.SATURATION; // % VWC

    // TAW (Total Available Water) in mm = (FC - PWP) / 100 × root_depth_cm × 10
    // Factor of 10 converts cm to mm and accounts for volumetric percentage
    const taw = ((fc - pwp) / 100) * rootDepthCm * 10;

    // RAW (Readily Available Water) in mm = MAD × TAW
    // MAD is the fraction of TAW that can be depleted before stress
    const raw = mad * taw;

    // Current water depth in root zone (mm)
    const currentDepth = (currentVWC / 100) * rootDepthCm * 10;

    // Field capacity depth (mm)
    const fcDepth = (fc / 100) * rootDepthCm * 10;

    // Saturation depth (mm) - for waterlogging detection
    const saturationDepth = (saturation / 100) * rootDepthCm * 10;

    // Depletion (mm) = FC depth - current depth
    const depletionMm = Math.max(0, fcDepth - currentDepth);

    // Depletion as percentage of TAW
    const depletionPercent = taw > 0 ? (depletionMm / taw) * 100 : 0;

    // Determine stress level based on depletion vs MAD threshold
    let stressLevel: 'none' | 'mild' | 'moderate' | 'severe';
    if (currentVWC >= fc) {
        stressLevel = 'none'; // At or above field capacity
    } else if (depletionPercent <= mad * 100) {
        stressLevel = 'none'; // Within readily available water
    } else if (depletionPercent <= mad * 100 * 1.2) {
        stressLevel = 'mild'; // Just past MAD threshold
    } else if (depletionPercent <= mad * 100 * 1.5) {
        stressLevel = 'moderate'; // Significant depletion
    } else {
        stressLevel = 'severe'; // Approaching wilting point
    }

    return {
        soilTexture,
        rootDepthCm,
        fieldCapacity: fc,
        wiltingPoint: pwp,
        saturation,
        taw: Number(taw.toFixed(1)),
        raw: Number(raw.toFixed(1)),
        mad,
        currentVWC,
        currentDepth: Number(currentDepth.toFixed(1)),
        depletionPercent: Number(Math.max(0, depletionPercent).toFixed(1)),
        stressLevel,
    };
}

/**
 * Calculate irrigation depth needed to restore soil moisture to target
 *
 * Formula: Depth = (Target VWC - Current VWC) / 100 × Root depth × 10  [mm]
 * Bounded by MIN and MAX irrigation depths from IRRIGATION_CONSTANTS
 *
 * @param balance - Current soil water balance
 * @param targetVWC - Target volumetric water content (%)
 * @param rootDepthCm - Crop root zone depth (cm)
 * @returns Irrigation depth in mm
 */
function calculateIrrigationDepth(
    balance: SoilWaterBalance,
    targetVWC: number,
    rootDepthCm: number
): number {
    // Target water depth (mm)
    const targetDepth = (targetVWC / 100) * rootDepthCm * 10;

    // Deficit (mm) = target - current
    const deficitMm = targetDepth - balance.currentDepth;

    // No irrigation if already at or above target
    if (deficitMm <= 0) {
        return 0;
    }

    // Apply bounds from IRRIGATION_CONSTANTS
    const depth = Math.max(
        IRRIGATION_CONSTANTS.MIN_IRRIGATION_DEPTH_MM,
        Math.min(deficitMm, IRRIGATION_CONSTANTS.MAX_IRRIGATION_DEPTH_MM)
    );

    return Number(depth.toFixed(1));
}

/**
 * Determine irrigation urgency based on multiple criteria
 *
 * Priority order:
 * 1. Waterlogging check (above saturation)
 * 2. Critical deficit (below crop minimum VWC)
 * 3. Crop optimal range position
 * 4. Depletion vs MAD threshold
 *
 * @param currentVWC - Current VWC (%)
 * @param balance - Soil water balance
 * @param cropParams - Crop parameters from database
 * @returns Urgency level and numeric score (0-100)
 */
function determineUrgency(
    currentVWC: number,
    balance: SoilWaterBalance,
    cropParams: IrrigationCropParams
): { urgency: IrrigationUrgency; score: number } {
    // Check for waterlogging first (above saturation)
    if (currentVWC >= balance.saturation) {
        return { urgency: IRRIGATION_URGENCY.NONE, score: 0 };
    }

    // Check for excessive moisture (above crop max)
    if (currentVWC > cropParams.vwcMax) {
        return { urgency: IRRIGATION_URGENCY.NONE, score: 0 };
    }

    // Critical deficit: below crop minimum acceptable VWC
    if (currentVWC < cropParams.vwcMin) {
        const deficit = cropParams.vwcMin - currentVWC;
        if (deficit > 5) {
            return { urgency: IRRIGATION_URGENCY.CRITICAL, score: 95 };
        } else if (deficit > 3) {
            return { urgency: IRRIGATION_URGENCY.HIGH, score: 80 };
        } else {
            return { urgency: IRRIGATION_URGENCY.MODERATE, score: 60 };
        }
    }

    // Within crop optimal range: fine-grained assessment
    if (currentVWC >= cropParams.vwcMin && currentVWC <= cropParams.vwcMax) {
        const optimalMid = cropParams.vwcOptimal;
        const distanceFromOptimal = Math.abs(currentVWC - optimalMid);
        const optimalRange = (cropParams.vwcMax - cropParams.vwcMin) / 2;

        if (distanceFromOptimal < optimalRange * 0.3) {
            // Very close to optimal center
            return { urgency: IRRIGATION_URGENCY.NONE, score: 0 };
        } else if (distanceFromOptimal < optimalRange * 0.7) {
            // Within optimal but approaching edges
            return { urgency: IRRIGATION_URGENCY.LOW, score: 25 };
        } else {
            // At edges of optimal range
            return { urgency: IRRIGATION_URGENCY.LOW, score: 35 };
        }
    }

    // Fallback: depletion-based logic (FAO-56 MAD approach)
    const madThreshold = balance.mad * 100; // Convert to percentage

    if (balance.depletionPercent > madThreshold * 1.3) {
        return { urgency: IRRIGATION_URGENCY.HIGH, score: 75 };
    } else if (balance.depletionPercent > madThreshold * 1.1) {
        return { urgency: IRRIGATION_URGENCY.MODERATE, score: 55 };
    } else if (balance.depletionPercent > madThreshold * 0.8) {
        return { urgency: IRRIGATION_URGENCY.LOW, score: 30 };
    }

    // Adequate moisture
    return { urgency: IRRIGATION_URGENCY.NONE, score: 0 };
}

/**
 * Make irrigation decision for a field
 *
 * Process:
 * 1. Validate field has confirmed crop
 * 2. Get latest sensor reading (VWC)
 * 3. Calculate soil water balance
 * 4. Determine base urgency
 * 5. Check weather forecast and adjust urgency
 * 6. Calculate irrigation depth and duration
 * 7. Generate decision and reason
 *
 * @param nodeId - Sensor node ID
 * @returns IrrigationDecision with recommendation and parameters
 */
export async function makeIrrigationDecision(nodeId: number): Promise<IrrigationDecision> {
    try {
        logger.info({ nodeId }, 'Making irrigation decision');

        // Get field configuration
        const field = await getFieldByNodeId(nodeId);
        if (!field) {
            throw new NotFoundError('Field', `nodeId=${nodeId}`);
        }

        if (!field.cropType || !field.cropConfirmed) {
            throw new ValidationError('Field must have confirmed crop for irrigation decisions');
        }

        // DB-first crop params (keeps irrigation consistent with crop recommendation service).
        // Fallback to constants (legacy) if DB is missing the crop row.
        let cropParams: IrrigationCropParams | null = null;

        const dbCrop = await prisma.cropParameters.findUnique({
            where: { cropName: field.cropType },
        });

        if (dbCrop) {
            cropParams = mapDbCropToIrrigationParams(dbCrop);
        } else {
            const fallback = CROP_DATABASE[field.cropType as CropName];
            if (!fallback) {
                throw new ValidationError(`Unknown crop type: ${field.cropType}`);
            }
            cropParams = fallback as unknown as IrrigationCropParams;
        }

        // Get latest sensor reading
        const reading = await getLatestReading(nodeId);
        if (!reading) {
            throw new NotFoundError('SensorReading', `No readings for nodeId=${nodeId}`);
        }

        if (reading.soilMoistureVWC === null || reading.soilMoistureVWC === undefined) {
            throw new NotFoundError('SensorReading', `No valid VWC reading for nodeId=${nodeId}`);
        }

        const currentVWC = reading.soilMoistureVWC;
        const soilTexture = field.soilTexture as SoilTexture;
        const growthStage = (field.currentGrowthStage as GrowthStage) || null;
        const accumulatedGDD = field.accumulatedGDD ?? 0;

        // Get current Kc value based on growth stage (uses new schema Kc field)
        const currentKc = getCurrentKc(cropParams, growthStage, accumulatedGDD);

        logger.debug(
            {
                nodeId,
                cropType: field.cropType,
                growthStage,
                accumulatedGDD,
                currentKc: currentKc.toFixed(2),
            },
            'Crop coefficient determined for irrigation calculation'
        );

        // Calculate soil water balance using FAO-56 methodology
        const balance = calculateWaterBalance(
            soilTexture,
            currentVWC,
            cropParams.rootDepthCm,
            cropParams.mad
        );

        logger.debug(
            {
                nodeId,
                currentVWC,
                taw: balance.taw,
                raw: balance.raw,
                depletion: balance.depletionPercent,
                stressLevel: balance.stressLevel,
            },
            'Soil water balance calculated'
        );

        // Determine base urgency
        const { urgency: baseUrgency, score: baseScore } = determineUrgency(currentVWC, balance, cropParams);

        // Check weather forecast for rain
        let weatherAdjustment: string | null = null;
        let finalUrgency = baseUrgency;
        let finalScore = baseScore;

        try {
            const rainCheck = await isRainExpected(
                field.latitude,
                field.longitude,
                IRRIGATION_CONSTANTS.RAIN_FORECAST_HOURS,
                IRRIGATION_CONSTANTS.RAIN_THRESHOLD_MM
            );

            if (rainCheck.expected) {
                weatherAdjustment = rainCheck.description;

                // Downgrade urgency if significant rain expected
                // Keep CRITICAL as-is to avoid crop stress
                if (baseUrgency === IRRIGATION_URGENCY.HIGH) {
                    finalUrgency = IRRIGATION_URGENCY.MODERATE;
                    finalScore = Math.max(50, baseScore - 25);
                } else if (baseUrgency === IRRIGATION_URGENCY.MODERATE) {
                    finalUrgency = IRRIGATION_URGENCY.LOW;
                    finalScore = Math.max(20, baseScore - 30);
                } else if (baseUrgency === IRRIGATION_URGENCY.LOW) {
                    finalUrgency = IRRIGATION_URGENCY.NONE;
                    finalScore = 0;
                }

                logger.info(
                    { nodeId, rainExpected: rainCheck.expected, adjustment: weatherAdjustment },
                    'Urgency adjusted for forecast rain'
                );
            }
        } catch (error) {
            logger.warn({ error, nodeId }, 'Weather check failed, proceeding without forecast adjustment');
        }

        // Determine decision FROM FINAL URGENCY
        let decision: 'irrigate_now' | 'irrigate_soon' | 'do_not_irrigate';
        if (finalUrgency === IRRIGATION_URGENCY.CRITICAL || finalUrgency === IRRIGATION_URGENCY.HIGH) {
            decision = 'irrigate_now';
        } else if (finalUrgency === IRRIGATION_URGENCY.MODERATE) {
            decision = 'irrigate_soon';
        } else {
            decision = 'do_not_irrigate';
        }

        // Target and deficit
        const targetVWC = cropParams.vwcOptimal;
        const deficit = Math.max(0, targetVWC - currentVWC);
        const deficitPctOfTarget = targetVWC > 0 ? (deficit / targetVWC) * 100 : 0;

        // Only compute irrigation parameters when we actually recommend irrigation
        const shouldIrrigate = decision !== 'do_not_irrigate';

        const suggestedDepthMm = shouldIrrigate
            ? calculateIrrigationDepth(balance, targetVWC, cropParams.rootDepthCm)
            : 0;

        // Application rate assumption used to convert depth -> time.
        // (Future: derive from field configuration / method.)
        const applicationRateMmPerHour = shouldIrrigate ? 5 : null; // mm/hour
        const applicationRateSource = shouldIrrigate ? ('default' as const) : ('unknown' as const);

        const suggestedDurationMin =
            shouldIrrigate && suggestedDepthMm > 0 && applicationRateMmPerHour
                ? Math.ceil((suggestedDepthMm / applicationRateMmPerHour) * 60)
                : 0;

        // Short explanation of how the urgency score was determined
        let scoreBasis: string | null = null;
        if (finalUrgency === IRRIGATION_URGENCY.NONE) {
            scoreBasis = 'Soil moisture within ideal or acceptable range for the crop.';
        } else if (finalUrgency === IRRIGATION_URGENCY.LOW) {
            scoreBasis =
                'Soil moisture within crop range but near the edge of the optimal band, low urgency threshold.';
        } else if (finalUrgency === IRRIGATION_URGENCY.MODERATE) {
            scoreBasis =
                'Moisture or depletion near management allowed depletion (MAD) threshold, moderate urgency.';
        } else if (finalUrgency === IRRIGATION_URGENCY.HIGH) {
            scoreBasis = 'Depletion clearly beyond MAD or VWC below crop minimum, high urgency for irrigation.';
        } else if (finalUrgency === IRRIGATION_URGENCY.CRITICAL) {
            scoreBasis =
                'Severe deficit well below crop minimum moisture or very high depletion, critical urgency.';
        }

        // Generate human-readable reason
        const reason = generateReason(
            decision,
            currentVWC,
            targetVWC,
            balance,
            cropParams,
            weatherAdjustment
        );

        // Next check timing
        const nextCheckHours = decision === 'irrigate_now' ? 6 : decision === 'irrigate_soon' ? 12 : 24;

        const result: IrrigationDecision = {
            nodeId,
            fieldName: field.fieldName,
            decision,
            urgency: finalUrgency,
            urgencyScore: finalScore,
            reason,
            currentVWC: Number(currentVWC.toFixed(1)),
            targetVWC: Number(targetVWC.toFixed(1)),
            deficit: Number(deficit.toFixed(1)),
            deficitPctOfTarget: Number(Math.max(0, deficitPctOfTarget).toFixed(1)),
            suggestedDepthMm,
            suggestedDurationMin,
            applicationRateMmPerHour,
            applicationRateSource,
            scoreBasis,
            cropType: field.cropType as CropName | null,
            growthStage,
            weatherAdjustment,
            nextCheckHours,
            timestamp: new Date(),
        };

        logger.info(
            {
                nodeId,
                decision,
                urgency: finalUrgency,
                currentVWC: currentVWC.toFixed(1),
                targetVWC: targetVWC.toFixed(1),
                depth: suggestedDepthMm,
                durationMin: suggestedDurationMin,
                applicationRateMmPerHour,
                Kc: currentKc.toFixed(2),
            },
            'Irrigation decision made'
        );

        return result;
    } catch (error) {
        logger.error({ error, nodeId }, 'Failed to make irrigation decision');
        throw error;
    }
}

/**
 * Generate human-readable irrigation reason
 *
 * @param decision - Irrigation decision type
 * @param currentVWC - Current VWC (%)
 * @param targetVWC - Target VWC (%)
 * @param balance - Soil water balance
 * @param cropParams - Crop parameters
 * @param weatherAdjustment - Weather forecast message
 * @returns Detailed reason string
 */
function generateReason(
    decision: string,
    currentVWC: number,
    targetVWC: number,
    balance: SoilWaterBalance,
    cropParams: IrrigationCropParams,
    weatherAdjustment: string | null
): string {
    const reasons: string[] = [];

    if (decision === 'irrigate_now') {
        if (currentVWC < cropParams.vwcMin) {
            const deficit = cropParams.vwcMin - currentVWC;
            reasons.push(`Critical moisture deficit detected: ${deficit.toFixed(1)}% below crop minimum`);
            reasons.push(`Current VWC ${currentVWC.toFixed(1)}% vs minimum ${cropParams.vwcMin}%`);
        } else if (balance.depletionPercent > balance.mad * 100 * 1.2) {
            reasons.push(
                `Soil depletion ${balance.depletionPercent.toFixed(0)}% exceeded MAD threshold (${(
                    balance.mad * 100
                ).toFixed(0)}%)`
            );
            reasons.push(`Water stress risk for ${cropParams.name}`);
        } else {
            reasons.push(`Immediate irrigation required to prevent crop stress`);
        }
    } else if (decision === 'irrigate_soon') {
        reasons.push(`Soil moisture approaching stress level`);
        reasons.push(`Current ${currentVWC.toFixed(1)}% vs optimal ${targetVWC.toFixed(1)}%`);
        reasons.push(`Depletion at ${balance.depletionPercent.toFixed(0)}% of TAW`);
    } else {
        if (currentVWC >= cropParams.vwcMin && currentVWC <= cropParams.vwcMax) {
            reasons.push(`Soil moisture optimal for ${cropParams.name}`);
            reasons.push(`Current ${currentVWC.toFixed(1)}% within range ${cropParams.vwcMin}-${cropParams.vwcMax}%`);
        } else if (currentVWC > cropParams.vwcMax) {
            reasons.push(`Soil moisture exceeds optimal range - risk of waterlogging`);
            reasons.push(`Avoid irrigation until moisture depletes to ${cropParams.vwcMax}%`);
        } else if (currentVWC >= balance.saturation) {
            reasons.push(`Soil saturated - no irrigation needed`);
        } else {
            reasons.push(`Soil moisture adequate at ${currentVWC.toFixed(1)}% VWC`);
        }
    }

    if (weatherAdjustment) {
        reasons.push(weatherAdjustment);
    }

    return reasons.join('. ');
}

/**
 * Get irrigation recommendations for multiple fields
 *
 * Useful for dashboard views or batch irrigation scheduling
 *
 * @param nodeIds - Array of sensor node IDs
 * @returns Array of irrigation decisions sorted by urgency (highest first)
 */
export async function getIrrigationRecommendations(nodeIds: number[]): Promise<IrrigationDecision[]> {
    const decisions: IrrigationDecision[] = [];

    for (const nodeId of nodeIds) {
        try {
            const decision = await makeIrrigationDecision(nodeId);
            decisions.push(decision);
        } catch (error) {
            logger.error({ error, nodeId }, 'Failed to get irrigation decision for node');
            // Continue with other nodes
        }
    }

    // Sort by urgency score descending (most urgent first)
    decisions.sort((a, b) => b.urgencyScore - a.urgencyScore);

    logger.info(
        { totalFields: nodeIds.length, decisionsGenerated: decisions.length },
        'Batch irrigation recommendations completed'
    );

    return decisions;
}
