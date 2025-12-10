// src/services/irrigation/irrigation.service.ts
/**
 * Irrigation Decision Service
 * FAO-56 inspired water balance with weather adjustment
 */
import { createLogger } from '../../config/logger.js';
import { SOIL_WATER_CONSTANTS, CROP_DATABASE, IRRIGATION_URGENCY, IRRIGATION_CONSTANTS, } from '../../utils/constants.js';
import { getFieldByNodeId } from '../../repositories/field.repository.js';
import { getLatestReading } from '../../repositories/sensor.repository.js';
import { isRainExpected, estimateDailyET } from '../weather/weather.sevice.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
const logger = createLogger({ service: 'irrigation' });
/**
 * Calculate soil water balance
 */
function calculateWaterBalance(soilTexture, currentVWC, rootDepth, mad) {
    const soilParams = SOIL_WATER_CONSTANTS[soilTexture];
    if (!soilParams) {
        throw new ValidationError(`Invalid soil texture: ${soilTexture}`);
    }
    const fc = soilParams.FIELD_CAPACITY;
    const pwp = soilParams.WILTING_POINT;
    // Total Available Water (mm) = (FC - PWP) × root depth (cm) × 10
    const taw = ((fc - pwp) / 100) * rootDepth * 10;
    // Readily Available Water (mm) = TAW × (1 - MAD)
    const raw = taw * (1 - mad);
    // Current water depth (mm)
    const currentDepth = (currentVWC / 100) * rootDepth * 10;
    // Depletion (% of TAW)
    const fcDepth = (fc / 100) * rootDepth * 10;
    const depletion = ((fcDepth - currentDepth) / taw) * 100;
    return {
        soilTexture,
        fieldCapacity: fc,
        wiltingPoint: pwp,
        taw: Number(taw.toFixed(1)),
        raw: Number(raw.toFixed(1)),
        currentVWC,
        currentDepth: Number(currentDepth.toFixed(1)),
        depletion: Number(Math.max(0, depletion).toFixed(1)),
        mad,
    };
}
/**
 * Calculate irrigation depth needed
 */
function calculateIrrigationDepth(balance, targetVWC, rootDepth) {
    const targetDepth = (targetVWC / 100) * rootDepth * 10;
    const deficit = targetDepth - balance.currentDepth;
    const depth = Math.max(IRRIGATION_CONSTANTS.MIN_IRRIGATION_DEPTH_MM, Math.min(deficit, IRRIGATION_CONSTANTS.MAX_IRRIGATION_DEPTH_MM));
    return Number(depth.toFixed(1));
}
/**
 * Determine urgency level
 * ✅ FIXED: Proper logic to check optimal range first
 */
function determineUrgency(currentVWC, balance, cropParams) {
    // ✅ FIX: Check if within crop optimal range FIRST
    if (currentVWC >= cropParams.vwcMin && currentVWC <= cropParams.vwcMax) {
        // Within optimal range - check fine-grained position
        const optimalMid = cropParams.vwcOptimal;
        const distanceFromOptimal = Math.abs(currentVWC - optimalMid);
        const optimalRange = (cropParams.vwcMax - cropParams.vwcMin) / 2;
        if (distanceFromOptimal < optimalRange * 0.3) {
            // Very close to optimal center
            return { urgency: IRRIGATION_URGENCY.NONE, score: 0 };
        }
        else if (distanceFromOptimal < optimalRange * 0.7) {
            // Within optimal but approaching edges
            return { urgency: IRRIGATION_URGENCY.LOW, score: 20 };
        }
        else {
            // At edges of optimal range
            return { urgency: IRRIGATION_URGENCY.LOW, score: 30 };
        }
    }
    // Critical: below minimum acceptable VWC
    if (currentVWC < cropParams.vwcMin) {
        const deficit = cropParams.vwcMin - currentVWC;
        if (deficit > 5) {
            return { urgency: IRRIGATION_URGENCY.CRITICAL, score: 95 };
        }
        else if (deficit > 2) {
            return { urgency: IRRIGATION_URGENCY.HIGH, score: 80 };
        }
        return { urgency: IRRIGATION_URGENCY.MODERATE, score: 60 }; // ✅ FIXED: MEDIUM → MODERATE
    }
    // Above maximum (too wet) - no irrigation needed
    if (currentVWC > cropParams.vwcMax) {
        return { urgency: IRRIGATION_URGENCY.NONE, score: 0 };
    }
    // Fallback to depletion-based logic (only if not in optimal range)
    if (balance.depletion > balance.mad * 100) {
        return { urgency: IRRIGATION_URGENCY.HIGH, score: 80 };
    }
    if (balance.depletion > balance.mad * 80) {
        return { urgency: IRRIGATION_URGENCY.MODERATE, score: 60 }; // ✅ FIXED: MEDIUM → MODERATE
    }
    if (balance.depletion > balance.mad * 50) {
        return { urgency: IRRIGATION_URGENCY.LOW, score: 30 };
    }
    // None: adequate moisture
    return { urgency: IRRIGATION_URGENCY.NONE, score: 0 };
}
/**
 * Make irrigation decision
 */
export async function makeIrrigationDecision(nodeId) {
    try {
        logger.info({ nodeId }, 'Making irrigation decision');
        // Get field configuration
        const field = await getFieldByNodeId(nodeId);
        if (!field.cropType || !field.cropConfirmed) {
            throw new ValidationError('Field must have confirmed crop for irrigation decisions');
        }
        // Validate crop exists in database
        const cropParams = CROP_DATABASE[field.cropType];
        if (!cropParams) {
            throw new ValidationError(`Unknown crop type: ${field.cropType}`);
        }
        // Get latest sensor reading
        const reading = await getLatestReading(nodeId);
        if (!reading || reading.soilMoistureVWC === null) {
            throw new NotFoundError('SensorReading', `No valid VWC reading for nodeId=${nodeId}`);
        }
        const currentVWC = reading.soilMoistureVWC;
        const soilTexture = field.soilTexture;
        const growthStage = field.currentGrowthStage || null;
        // Calculate water balance
        const balance = calculateWaterBalance(soilTexture, currentVWC, cropParams.rootDepth, cropParams.mad);
        // Determine base urgency
        const { urgency: baseUrgency, score: baseScore } = determineUrgency(currentVWC, balance, cropParams);
        // Check weather forecast
        let weatherAdjustment = null;
        let finalUrgency = baseUrgency;
        let finalScore = baseScore;
        try {
            const rainCheck = await isRainExpected(field.latitude, field.longitude, IRRIGATION_CONSTANTS.RAIN_FORECAST_HOURS, IRRIGATION_CONSTANTS.RAIN_THRESHOLD_MM);
            if (rainCheck.expected) {
                weatherAdjustment = rainCheck.description;
                // Downgrade urgency if rain expected
                if (baseUrgency === IRRIGATION_URGENCY.HIGH) {
                    finalUrgency = IRRIGATION_URGENCY.MODERATE; // ✅ FIXED: MEDIUM → MODERATE
                    finalScore = Math.max(50, baseScore - 30);
                }
                else if (baseUrgency === IRRIGATION_URGENCY.MODERATE) { // ✅ FIXED: MEDIUM → MODERATE
                    finalUrgency = IRRIGATION_URGENCY.LOW;
                    finalScore = Math.max(20, baseScore - 30);
                }
                else if (baseUrgency === IRRIGATION_URGENCY.LOW) {
                    finalUrgency = IRRIGATION_URGENCY.NONE;
                    finalScore = 0;
                }
                // Keep CRITICAL as is - don't risk crop stress
            }
        }
        catch (error) {
            logger.warn({ error, nodeId }, 'Weather check failed, proceeding without adjustment');
        }
        // Calculate irrigation depth
        const targetVWC = cropParams.vwcOptimal;
        const deficit = Math.max(0, targetVWC - currentVWC);
        const suggestedDepthMm = finalUrgency === IRRIGATION_URGENCY.NONE
            ? 0
            : calculateIrrigationDepth(balance, targetVWC, cropParams.rootDepth);
        // Estimate duration (simplified: assume 5mm/hour application rate for drip)
        const applicationRate = 5; // mm/hour
        const suggestedDurationMin = suggestedDepthMm > 0
            ? Math.ceil((suggestedDepthMm / applicationRate) * 60)
            : 0;
        // Determine decision
        let decision;
        if (finalUrgency === IRRIGATION_URGENCY.CRITICAL) {
            decision = 'irrigate_now';
        }
        else if (finalUrgency === IRRIGATION_URGENCY.HIGH) {
            decision = 'irrigate_now';
        }
        else if (finalUrgency === IRRIGATION_URGENCY.MODERATE) { // ✅ FIXED: MEDIUM → MODERATE
            decision = 'irrigate_soon';
        }
        else if (finalUrgency === IRRIGATION_URGENCY.LOW) {
            decision = 'do_not_irrigate';
        }
        else {
            decision = 'do_not_irrigate';
        }
        // Generate reason
        const reason = generateReason(decision, currentVWC, targetVWC, balance, cropParams, weatherAdjustment);
        // Next check hours
        const nextCheckHours = decision === 'irrigate_now' ? 6 : decision === 'irrigate_soon' ? 12 : 24;
        const result = {
            nodeId,
            fieldName: field.fieldName,
            decision,
            urgency: finalUrgency,
            urgencyScore: finalScore,
            reason,
            currentVWC: Number(currentVWC.toFixed(1)),
            targetVWC: Number(targetVWC.toFixed(1)),
            deficit: Number(deficit.toFixed(1)),
            suggestedDepthMm,
            suggestedDurationMin,
            cropType: field.cropType,
            growthStage,
            weatherAdjustment,
            nextCheckHours,
            timestamp: new Date(),
        };
        logger.info({ nodeId, decision, urgency: finalUrgency, currentVWC, targetVWC }, 'Irrigation decision made');
        return result;
    }
    catch (error) {
        logger.error({ error, nodeId }, 'Failed to make irrigation decision');
        throw error;
    }
}
/**
 * Generate human-readable reason
 */
function generateReason(decision, currentVWC, targetVWC, balance, cropParams, weatherAdjustment) {
    const reasons = [];
    if (decision === 'irrigate_now') {
        if (currentVWC < cropParams.vwcMin) {
            reasons.push(`Severe moisture deficit - irrigate immediately`);
            reasons.push(`Current VWC (${currentVWC.toFixed(1)}%) below crop minimum (${cropParams.vwcMin}%)`);
        }
        else if (balance.depletion > balance.mad * 100) {
            reasons.push(`Soil depletion (${balance.depletion.toFixed(0)}%) exceeded MAD threshold`);
        }
    }
    else if (decision === 'irrigate_soon') {
        reasons.push(`VWC approaching stress level`);
        reasons.push(`Current ${currentVWC.toFixed(1)}% vs optimal ${targetVWC.toFixed(1)}%`);
    }
    else {
        if (currentVWC >= cropParams.vwcMin && currentVWC <= cropParams.vwcMax) {
            reasons.push(`Soil moisture within optimal range for ${cropParams.name}`);
        }
        else if (currentVWC > cropParams.vwcMax) {
            reasons.push(`Soil moisture exceeds optimal range - avoid irrigation`);
        }
        else {
            reasons.push(`Soil moisture adequate (${currentVWC.toFixed(1)}% VWC)`);
        }
    }
    if (weatherAdjustment) {
        reasons.push(weatherAdjustment);
    }
    return reasons.join('. ');
}
/**
 * Get irrigation recommendations for multiple fields
 */
export async function getIrrigationRecommendations(nodeIds) {
    const decisions = [];
    for (const nodeId of nodeIds) {
        try {
            const decision = await makeIrrigationDecision(nodeId);
            decisions.push(decision);
        }
        catch (error) {
            logger.error({ error, nodeId }, 'Failed to get irrigation decision for node');
        }
    }
    // Sort by urgency score descending
    decisions.sort((a, b) => b.urgencyScore - a.urgencyScore);
    return decisions;
}
//# sourceMappingURL=irrigation.service.js.map