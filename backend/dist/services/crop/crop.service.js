// src/services/crop/crop.service.ts
/**
 * Crop Recommendation Service
 * Multi-criteria scoring for crop suitability
 */
import { createLogger } from '../../config/logger.js';
import { CROP_DATABASE, getCurrentSeason, UP_VALID_CROPS, } from '../../utils/constants.js';
import { getFieldByNodeId } from '../../repositories/field.repository.js';
import { getLatestReading } from '../../repositories/sensor.repository.js';
import { NotFoundError } from '../../utils/errors.js';
const logger = createLogger({ service: 'crop' });
// Scoring weights (must sum to 100)
const WEIGHTS = {
    MOISTURE: 25,
    TEMPERATURE: 25,
    SEASON: 25,
    SOIL: 15,
    GDD_FEASIBILITY: 10,
};
/**
 * Score moisture match (0-25 points)
 */
function scoreMoisture(currentVWC, crop) {
    const { vwcMin, vwcOptimal, vwcMax } = crop;
    // Perfect match at optimal
    if (currentVWC === vwcOptimal) {
        return WEIGHTS.MOISTURE;
    }
    // Within acceptable range
    if (currentVWC >= vwcMin && currentVWC <= vwcMax) {
        const distanceFromOptimal = Math.abs(currentVWC - vwcOptimal);
        const maxDistance = Math.max(vwcOptimal - vwcMin, vwcMax - vwcOptimal);
        const score = WEIGHTS.MOISTURE * (1 - distanceFromOptimal / maxDistance);
        return Math.max(score, WEIGHTS.MOISTURE * 0.5); // Minimum 50% if in range
    }
    // Outside range - score based on distance
    const distanceOutside = currentVWC < vwcMin
        ? vwcMin - currentVWC
        : currentVWC - vwcMax;
    const penalty = Math.min(distanceOutside / 10, 1); // 10% distance = full penalty
    return WEIGHTS.MOISTURE * (1 - penalty) * 0.3; // Max 30% of points if outside range
}
/**
 * Score temperature match (0-25 points)
 */
function scoreTemperature(currentTemp, crop) {
    const { optimalTempMin, optimalTempMax } = crop;
    // Within optimal range
    if (currentTemp >= optimalTempMin && currentTemp <= optimalTempMax) {
        return WEIGHTS.TEMPERATURE;
    }
    // Outside range - penalty based on distance
    const distanceOutside = currentTemp < optimalTempMin
        ? optimalTempMin - currentTemp
        : currentTemp - optimalTempMax;
    const penalty = Math.min(distanceOutside / 10, 1); // 10°C = full penalty
    return WEIGHTS.TEMPERATURE * (1 - penalty) * 0.4; // Max 40% if outside range
}
/**
 * Score season appropriateness (0-25 points)
 */
function scoreSeason(currentSeason, crop) {
    return crop.season === currentSeason ? WEIGHTS.SEASON : 0;
}
/**
 * Score soil compatibility (0-15 points)
 */
function scoreSoil(soilTexture, crop) {
    return crop.preferredSoils.includes(soilTexture) ? WEIGHTS.SOIL : 0;
}
/**
 * Score GDD feasibility (0-10 points)
 * Based on whether crop can complete growth cycle with remaining season
 */
function scoreGDDFeasibility(currentSeason, accumulatedGDD, crop) {
    // If crop season doesn't match, GDD not feasible
    if (crop.season !== currentSeason) {
        return 0;
    }
    // If already has significant GDD accumulated for a different crop, penalize
    if (accumulatedGDD > crop.totalGDD * 0.2) {
        return WEIGHTS.GDD_FEASIBILITY * 0.3;
    }
    // Full points if starting fresh in correct season
    return WEIGHTS.GDD_FEASIBILITY;
}
/**
 * Generate explanation for crop score
 */
function generateExplanation(crop, scores, currentVWC, currentTemp, currentSeason, soilTexture) {
    const reasons = [];
    // Moisture
    if (scores.moisture >= WEIGHTS.MOISTURE * 0.8) {
        reasons.push('Excellent moisture match');
    }
    else if (scores.moisture >= WEIGHTS.MOISTURE * 0.5) {
        reasons.push('Acceptable moisture');
    }
    else {
        reasons.push(`Moisture suboptimal (current: ${currentVWC.toFixed(1)}%, needs: ${crop.vwcMin}-${crop.vwcMax}%)`);
    }
    // Temperature
    if (scores.temperature >= WEIGHTS.TEMPERATURE * 0.8) {
        reasons.push('Optimal temperature');
    }
    else if (scores.temperature >= WEIGHTS.TEMPERATURE * 0.5) {
        reasons.push('Acceptable temperature');
    }
    else {
        reasons.push(`Temperature outside range (current: ${currentTemp.toFixed(1)}°C, needs: ${crop.optimalTempMin}-${crop.optimalTempMax}°C)`);
    }
    // Season
    if (scores.season > 0) {
        reasons.push(`${crop.season} season match`);
    }
    else {
        reasons.push(`Wrong season (${crop.season} crop, currently ${currentSeason})`);
    }
    // Soil
    if (scores.soil > 0) {
        reasons.push('Suitable soil type');
    }
    else {
        reasons.push(`Soil not ideal (prefers: ${crop.preferredSoils.join(', ')})`);
    }
    return reasons.join('; ');
}
/**
 * Calculate crop suitability score
 */
function calculateCropScore(crop, currentVWC, currentTemp, currentSeason, soilTexture, accumulatedGDD) {
    const scores = {
        moisture: scoreMoisture(currentVWC, crop),
        temperature: scoreTemperature(currentTemp, crop),
        season: scoreSeason(currentSeason, crop),
        soil: scoreSoil(soilTexture, crop),
        gddFeasibility: scoreGDDFeasibility(currentSeason, accumulatedGDD, crop),
    };
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const explanation = generateExplanation(crop, scores, currentVWC, currentTemp, currentSeason, soilTexture);
    return {
        cropName: crop.name,
        totalScore: Number(totalScore.toFixed(1)),
        rank: 0, // Will be set after sorting
        scores: {
            moisture: Number(scores.moisture.toFixed(1)),
            temperature: Number(scores.temperature.toFixed(1)),
            season: Number(scores.season.toFixed(1)),
            soil: Number(scores.soil.toFixed(1)),
            gddFeasibility: Number(scores.gddFeasibility.toFixed(1)),
        },
        explanation,
        suitable: totalScore >= 60, // 60/100 threshold for "suitable"
    };
}
/**
 * Get crop recommendations for field
 */
export async function getCropRecommendations(nodeId) {
    try {
        logger.info({ nodeId }, 'Generating crop recommendations');
        // Get field configuration
        const field = await getFieldByNodeId(nodeId);
        // Get latest sensor data
        const reading = await getLatestReading(nodeId);
        if (!reading || reading.soilMoistureVWC === null || reading.soilTemperature === null) {
            throw new NotFoundError('SensorReading', `No valid readings for nodeId=${nodeId}`);
        }
        const currentVWC = reading.soilMoistureVWC;
        const currentTemp = reading.soilTemperature;
        const currentSeason = getCurrentSeason();
        const soilTexture = field.soilTexture;
        const accumulatedGDD = field.accumulatedGDD;
        // Score all crops
        const allScores = UP_VALID_CROPS.map(cropName => {
            const cropParams = CROP_DATABASE[cropName];
            return calculateCropScore(cropParams, currentVWC, currentTemp, currentSeason, soilTexture, accumulatedGDD);
        });
        // Sort by score descending
        allScores.sort((a, b) => b.totalScore - a.totalScore);
        // Assign ranks
        allScores.forEach((score, index) => {
            score.rank = index + 1;
        });
        const topCrop = allScores[0];
        if (!topCrop) {
            throw new Error('No crops could be scored');
        }
        logger.info({ nodeId, recommendedCrop: topCrop.cropName, score: topCrop.totalScore }, 'Crop recommendation generated');
        return {
            nodeId,
            fieldName: field.fieldName,
            currentSeason,
            recommendedCrop: topCrop.cropName,
            topCrops: allScores.slice(0, 5), // Top 5 recommendations
            conditions: {
                currentVWC,
                currentSoilTemp: currentTemp,
                soilTexture,
                accumulatedGDD,
            },
            timestamp: new Date(),
        };
    }
    catch (error) {
        logger.error({ error, nodeId }, 'Failed to generate crop recommendations');
        throw error;
    }
}
//# sourceMappingURL=crop.service.js.map