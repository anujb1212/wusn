/**
 * Crop Recommendation Service
 * 
 * Multi-Criteria Decision Analysis (MCDA) for crop suitability
 * Uses 20-crop universe only, with research-backed scoring weights
 * 
 * Data sources:
 * - Gateway: soilMoisture (VWC), soilTemperature, airTemperature, airHumidity
 * - Field: soilTexture, accumulatedGDD
 * - External: current season (date-based for UP)
 * 
 * Scoring criteria (total 100 points):
 * - Moisture suitability: 30 points (most critical for immediate growth)
 * - Air temperature suitability: 25 points (optimal temp range)
 * - Season match: 20 points (Rabi/Kharif/Zaid/Perennial)
 * - Soil texture: 15 points (preferred soil types)
 * - GDD feasibility: 10 points (can complete cycle in remaining season)
 * 
 * References:
 * - Multi-Criteria Decision Making for crop selection (MCDM methodology)
 * - FAO crop suitability assessment guidelines
 * - ICAR recommendations for UP crops
 * 
 * UPDATED: Dec 11, 2025 - Aligned with new Prisma CropParameters schema
 */

import { createLogger } from '../../config/logger.js';
import {
    CROP_DATABASE,
    VALID_CROPS,
    getCurrentSeason,
    SOIL_WATER_CONSTANTS,
} from '../../utils/constants.js';
import type { CropName, SoilTexture, Season, CropParameters } from '../../utils/constants.js';
import { getFieldByNodeId } from '../../repositories/field.repository.js';
import { getLatestReading } from '../../repositories/sensor.repository.js';
import type { CropRecommendation, CropScore } from '../../models/common.types.js';
import { NotFoundError } from '../../utils/errors.js';

const logger = createLogger({ service: 'crop-recommendation' });

/**
 * Scoring weights (MCDM methodology)
 * Based on research: moisture and temperature are primary factors,
 * season and soil are secondary constraints, GDD is feasibility check
 */
const WEIGHTS = {
    MOISTURE: 30,        // Immediate soil water availability
    TEMPERATURE: 25,     // Air temperature for photosynthesis/growth
    SEASON: 20,          // Seasonality match for UP climate
    SOIL: 15,            // Soil texture preference
    GDD_FEASIBILITY: 10, // Can complete growth cycle
} as const;

/**
 * Suitability threshold
 * Crops scoring >= 60/100 are considered "suitable"
 */
const SUITABILITY_THRESHOLD = 60;

/**
 * Score moisture suitability (0-30 points)
 * 
 * Rationale:
 * - Optimal VWC: full points
 * - Within acceptable range: scaled by distance from optimal
 * - Outside range: heavy penalty based on deficit/excess severity
 * - Considers soil texture field capacity and wilting point
 */
function scoreMoisture(
    currentVWC: number,
    crop: CropParameters,
    soilTexture: SoilTexture
): number {
    const { vwcMin, vwcOptimal, vwcMax } = crop;
    const soilConstants = SOIL_WATER_CONSTANTS[soilTexture];

    // Check for waterlogging (above field capacity)
    if (currentVWC > soilConstants.FIELD_CAPACITY) {
        const excessPenalty = Math.min(
            (currentVWC - soilConstants.FIELD_CAPACITY) / 10,
            1.0
        );
        return WEIGHTS.MOISTURE * (1 - excessPenalty) * 0.2; // Max 20% if waterlogged
    }

    // Check for severe stress (below wilting point)
    if (currentVWC < soilConstants.WILTING_POINT) {
        return 0; // No points if below wilting point
    }

    // Perfect match at optimal
    if (Math.abs(currentVWC - vwcOptimal) < 1.0) {
        return WEIGHTS.MOISTURE;
    }

    // Within acceptable range
    if (currentVWC >= vwcMin && currentVWC <= vwcMax) {
        const distanceFromOptimal = Math.abs(currentVWC - vwcOptimal);
        const maxDistance = Math.max(vwcOptimal - vwcMin, vwcMax - vwcOptimal);
        const normalizedDistance = distanceFromOptimal / maxDistance;
        // Linear interpolation: 100% at optimal, 60% at boundaries
        const score = WEIGHTS.MOISTURE * (1 - normalizedDistance * 0.4);
        return Math.max(score, WEIGHTS.MOISTURE * 0.6);
    }

    // Outside acceptable range but not critical
    const distanceOutside = currentVWC < vwcMin
        ? (vwcMin - currentVWC)
        : (currentVWC - vwcMax);

    // Exponential penalty: 5% distance = 50% penalty, 10% = full penalty
    const penalty = Math.min(distanceOutside / 10, 1.0);
    return WEIGHTS.MOISTURE * (1 - penalty) * 0.3; // Max 30% if outside range
}

/**
 * Score air temperature suitability (0-25 points)
 * 
 * Uses SOIL temperature (soilTempMin/Optimal/Max from new schema)
 * Soil temp is more stable and directly affects root growth and germination
 * 
 * FIXED: Now uses soilTempMin/Optimal/Max instead of optimalTempMin/Max
 */
function scoreTemperature(
    currentSoilTemp: number,
    crop: CropParameters
): number {
    const { soilTempMin, soilTempOptimal, soilTempMax } = crop;

    // Within optimal range
    if (currentSoilTemp >= soilTempMin && currentSoilTemp <= soilTempMax) {
        // Peak at optimal temperature
        const distanceFromOptimal = Math.abs(currentSoilTemp - soilTempOptimal);
        const maxDistance = Math.max(
            soilTempOptimal - soilTempMin,
            soilTempMax - soilTempOptimal
        );
        const normalizedDistance = maxDistance > 0 ? distanceFromOptimal / maxDistance : 0;
        // 100% at optimal, 85% at boundaries of acceptable range
        return WEIGHTS.TEMPERATURE * (1 - normalizedDistance * 0.15);
    }

    // Outside optimal range - penalty based on severity
    const distanceOutside = currentSoilTemp < soilTempMin
        ? (soilTempMin - currentSoilTemp)
        : (currentSoilTemp - soilTempMax);

    // Temperature stress thresholds
    if (distanceOutside > 15) {
        return 0; // >15°C outside optimal = lethal for most crops
    }

    // Gradual penalty: 10°C = 70% penalty, 15°C = full penalty
    const penalty = Math.min(distanceOutside / 15, 1.0);
    return WEIGHTS.TEMPERATURE * (1 - penalty) * 0.4; // Max 40% if outside range
}

/**
 * Score season appropriateness (0-20 points)
 * 
 * Binary scoring: full points if season matches, zero otherwise
 * Exception: PERENNIAL crops get full points in any season
 */
function scoreSeason(
    currentSeason: Season,
    crop: CropParameters
): number {
    if (crop.season === 'PERENNIAL') {
        return WEIGHTS.SEASON; // Perennials suitable year-round
    }

    return crop.season === currentSeason ? WEIGHTS.SEASON : 0;
}

/**
 * Score soil texture compatibility (0-15 points)
 * 
 * Full points if soil texture in crop's preferred list
 * Partial points if soil is "adjacent" texture class
 */
function scoreSoil(
    soilTexture: SoilTexture,
    crop: CropParameters
): number {
    // Exact match
    if (crop.preferredSoils.includes(soilTexture)) {
        return WEIGHTS.SOIL;
    }

    // Adjacent soil textures (partial credit)
    const adjacentSoils: Record<SoilTexture, SoilTexture[]> = {
        SANDY: ['SANDY_LOAM'],
        SANDY_LOAM: ['SANDY', 'LOAM'],
        LOAM: ['SANDY_LOAM', 'CLAY_LOAM'],
        CLAY_LOAM: ['LOAM', 'CLAY'],
        CLAY: ['CLAY_LOAM'],
    };

    const isAdjacent = adjacentSoils[soilTexture]?.some(adj =>
        crop.preferredSoils.includes(adj)
    );

    return isAdjacent ? WEIGHTS.SOIL * 0.5 : 0; // 50% points for adjacent texture
}

/**
 * Score GDD feasibility (0-10 points)
 * 
 * Checks if crop can complete growth cycle within remaining season
 * Considers:
 * - Season match (prerequisite)
 * - Accumulated GDD vs crop requirement
 * - Estimated days remaining in season
 * 
 * FIXED: Now uses lateSeasonGDD instead of stages.lateSeason
 */
function scoreGDDFeasibility(
    currentSeason: Season,
    currentDate: Date,
    accumulatedGDD: number,
    crop: CropParameters
): number {
    // If crop season doesn't match current season, not feasible
    if (crop.season !== currentSeason && crop.season !== 'PERENNIAL') {
        return 0;
    }

    // Total GDD required = lateSeasonGDD (cumulative to maturity)
    const totalGDDRequired = crop.lateSeasonGDD;

    // If significant GDD already accumulated for different crop, penalize
    if (accumulatedGDD > totalGDDRequired * 0.25) {
        return WEIGHTS.GDD_FEASIBILITY * 0.2; // 20% points if late planting
    }

    // Estimate days remaining in season (Lucknow, UP)
    const month = currentDate.getMonth() + 1;
    let daysRemainingInSeason = 0;

    switch (currentSeason) {
        case 'RABI': // Nov-Feb
            daysRemainingInSeason = month >= 11 ? (120 - (month - 11) * 30) : (90 - (month - 1) * 30);
            break;
        case 'KHARIF': // Jun-Oct
            daysRemainingInSeason = 150 - (month - 6) * 30;
            break;
        case 'ZAID': // Mar-May
            daysRemainingInSeason = 90 - (month - 3) * 30;
            break;
        case 'PERENNIAL':
            daysRemainingInSeason = 365; // Always feasible
            break;
    }

    // Estimate crop duration in days (assuming ~15 GDD per day average in UP)
    const estimatedCropDurationDays = totalGDDRequired / 15;

    if (daysRemainingInSeason < estimatedCropDurationDays * 0.8) {
        // Less than 80% of crop duration remaining = not feasible
        return 0;
    }

    if (daysRemainingInSeason < estimatedCropDurationDays * 1.1) {
        // Tight fit (80-110% of duration) = partial points
        return WEIGHTS.GDD_FEASIBILITY * 0.6;
    }

    // Ample time remaining = full points
    return WEIGHTS.GDD_FEASIBILITY;
}

/**
 * Generate human-readable explanation for crop score
 * 
 * FIXED: Now uses soilTempMin/Max instead of optimalTempMin/Max
 */
function generateExplanation(
    crop: CropParameters,
    scores: CropScore['scores'],
    currentVWC: number,
    currentSoilTemp: number,
    currentSeason: Season,
    soilTexture: SoilTexture
): string {
    const reasons: string[] = [];

    // Moisture assessment
    if (scores.moisture >= WEIGHTS.MOISTURE * 0.8) {
        reasons.push('excellent soil moisture match');
    } else if (scores.moisture >= WEIGHTS.MOISTURE * 0.5) {
        reasons.push('acceptable soil moisture');
    } else if (scores.moisture > 0) {
        const status = currentVWC < crop.vwcMin ? 'too dry' : 'too wet';
        reasons.push(`soil moisture ${status} (current: ${currentVWC.toFixed(1)}%, optimal: ${crop.vwcMin}-${crop.vwcMax}%)`);
    } else {
        reasons.push('critical soil moisture deficit');
    }

    // Temperature assessment (now using soil temp)
    if (scores.temperature >= WEIGHTS.TEMPERATURE * 0.8) {
        reasons.push('optimal soil temperature');
    } else if (scores.temperature >= WEIGHTS.TEMPERATURE * 0.5) {
        reasons.push('acceptable soil temperature');
    } else if (scores.temperature > 0) {
        const status = currentSoilTemp < crop.soilTempMin ? 'too cool' : 'too hot';
        reasons.push(`soil temperature ${status} (current: ${currentSoilTemp.toFixed(1)}°C, optimal: ${crop.soilTempMin}-${crop.soilTempMax}°C)`);
    } else {
        reasons.push('soil temperature unsuitable');
    }

    // Season assessment
    if (scores.season > 0) {
        reasons.push(`${crop.season.toLowerCase()} season crop`);
    } else {
        reasons.push(`wrong season (${crop.season.toLowerCase()} crop in ${currentSeason.toLowerCase()} season)`);
    }

    // Soil assessment
    if (scores.soil === WEIGHTS.SOIL) {
        reasons.push('ideal soil texture');
    } else if (scores.soil > 0) {
        reasons.push('acceptable soil texture');
    } else {
        reasons.push(`soil not optimal (prefers ${crop.preferredSoils.join('/')})`);
    }

    // GDD feasibility
    if (scores.gddFeasibility === 0 && crop.season !== 'PERENNIAL') {
        reasons.push('insufficient time to complete growth cycle');
    }

    return reasons.join('; ');
}

/**
 * Calculate comprehensive crop suitability score
 * 
 * FIXED: Now passes currentSoilTemp to scoreTemperature and generateExplanation
 */
function calculateCropScore(
    crop: CropParameters,
    currentVWC: number,
    currentSoilTemp: number,
    currentSeason: Season,
    currentDate: Date,
    soilTexture: SoilTexture,
    accumulatedGDD: number
): CropScore {
    const scores = {
        moisture: scoreMoisture(currentVWC, crop, soilTexture),
        temperature: scoreTemperature(currentSoilTemp, crop),
        season: scoreSeason(currentSeason, crop),
        soil: scoreSoil(soilTexture, crop),
        gddFeasibility: scoreGDDFeasibility(currentSeason, currentDate, accumulatedGDD, crop),
    };

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

    const explanation = generateExplanation(
        crop,
        scores,
        currentVWC,
        currentSoilTemp,
        currentSeason,
        soilTexture
    );

    return {
        cropName: crop.name,
        totalScore: Number(totalScore.toFixed(1)),
        rank: 0, // Assigned after sorting
        scores: {
            moisture: Number(scores.moisture.toFixed(1)),
            temperature: Number(scores.temperature.toFixed(1)),
            season: Number(scores.season.toFixed(1)),
            soil: Number(scores.soil.toFixed(1)),
            gddFeasibility: Number(scores.gddFeasibility.toFixed(1)),
        },
        explanation,
        suitable: totalScore >= SUITABILITY_THRESHOLD,
    };
}

/**
 * Generate crop recommendations for a field
 * 
 * Process:
 * 1. Fetch field configuration and latest sensor reading
 * 2. Extract current conditions (VWC, soil temp, soil texture, season)
 * 3. Score all 20 crops using MCDA methodology
 * 4. Rank crops by total score
 * 5. Return top recommendation and full ranking
 * 
 * @param nodeId - Sensor node ID
 * @returns CropRecommendation with ranked list of all 20 crops
 * @throws NotFoundError if field or sensor data not found
 * 
 * FIXED: Now uses soilTemperature instead of airTemperature for scoring
 */
export async function getCropRecommendations(nodeId: number): Promise<CropRecommendation> {
    try {
        logger.info({ nodeId }, 'Generating crop recommendations using MCDA');

        // 1. Get field configuration
        const field = await getFieldByNodeId(nodeId);
        if (!field) {
            throw new NotFoundError('Field', `nodeId=${nodeId}`);
        }

        // 2. Get latest sensor reading
        const reading = await getLatestReading(nodeId);
        if (!reading) {
            throw new NotFoundError('SensorReading', `nodeId=${nodeId}`);
        }

        // Validate required data
        if (reading.soilMoistureVWC === null || reading.soilMoistureVWC === undefined) {
            throw new NotFoundError('SensorReading', `No valid soil moisture for nodeId=${nodeId}`);
        }

        if (reading.soilTemperature === null || reading.soilTemperature === undefined) {
            throw new NotFoundError('SensorReading', `No valid soil temperature for nodeId=${nodeId}`);
        }

        // 3. Extract current conditions
        const currentVWC = reading.soilMoistureVWC;
        const currentSoilTemp = reading.soilTemperature; // Use SOIL temp (aligned with new schema)
        const currentAirTemp = reading.airTemperature ?? 0;
        const soilTexture = field.soilTexture as SoilTexture;
        const accumulatedGDD = field.accumulatedGDD ?? 0;
        const currentSeason = getCurrentSeason();
        const currentDate = new Date();

        logger.debug({
            nodeId,
            currentVWC,
            currentSoilTemp,
            currentAirTemp,
            currentSeason,
            soilTexture,
            accumulatedGDD,
        }, 'Current field conditions');

        // 4. Score all 20 crops
        const allScores: CropScore[] = VALID_CROPS.map(cropName => {
            const cropParams = CROP_DATABASE[cropName];
            return calculateCropScore(
                cropParams,
                currentVWC,
                currentSoilTemp, // Pass soil temp
                currentSeason,
                currentDate,
                soilTexture,
                accumulatedGDD
            );
        });

        // 5. Sort by total score (descending)
        allScores.sort((a, b) => b.totalScore - a.totalScore);

        // Assign ranks
        allScores.forEach((score, index) => {
            score.rank = index + 1;
        });

        const topCrop = allScores[0];
        if (!topCrop) {
            throw new Error('No crops could be scored (internal error)');
        }

        logger.info({
            nodeId,
            recommendedCrop: topCrop.cropName,
            score: topCrop.totalScore,
            suitable: topCrop.suitable,
            topFive: allScores.slice(0, 5).map(c => ({ name: c.cropName, score: c.totalScore })),
        }, 'Crop recommendation generated');

        return {
            nodeId,
            fieldName: field.fieldName,
            currentSeason,
            recommendedCrop: topCrop.cropName,
            topCrops: allScores, // Return all 20 crops ranked
            conditions: {
                currentVWC,
                currentAirTemp,
                currentSoilTemp,
                soilTexture,
                accumulatedGDD,
            },
            timestamp: new Date(),
        };

    } catch (error) {
        logger.error({ error, nodeId }, 'Failed to generate crop recommendations');
        throw error;
    }
}
