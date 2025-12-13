/**
 * Crop Recommendation Service
 *
 * Alignment changes:
 * - Crop catalog uses Prisma CropParameters table (seeded)
 * - Recommendations score DB crops (validForUP=true)
 * - Type-guard keeps compatibility with existing CropName literal union types
 */
import { createLogger } from '../../config/logger.js';
import { prisma } from '../../config/database.js';
import { getCurrentSeason, SOIL_WATER_CONSTANTS, VALID_CROPS } from '../../utils/constants.js';
import { getFieldByNodeId } from '../../repositories/field.repository.js';
import { getLatestReading } from '../../repositories/sensor.repository.js';
import { NotFoundError } from '../../utils/errors.js';
const logger = createLogger({ service: 'crop-recommendation' });
function toTitleCaseLabel(value) {
    return value
        .split('_')
        .map((p) => (p.length ? p[0].toUpperCase() + p.slice(1) : p))
        .join(' ');
}
function isKnownCropName(name) {
    return VALID_CROPS.includes(name);
}
export async function getCropCatalog() {
    const rows = await prisma.cropParameters.findMany({
        where: { validForUP: true },
        select: { cropName: true, season: true },
        orderBy: { cropName: 'asc' },
    });
    if (rows.length === 0) {
        logger.warn('Crop catalog is empty (no CropParameters with validForUP=true). Did you run prisma seed on the correct DATABASE_URL?');
    }
    return rows.map((r) => ({
        value: r.cropName,
        labelEn: toTitleCaseLabel(r.cropName),
        season: r.season,
    }));
}
const WEIGHTS = {
    MOISTURE: 30,
    TEMPERATURE: 25,
    SEASON: 20,
    SOIL: 15,
    GDD_FEASIBILITY: 10,
};
const SUITABILITY_THRESHOLD = 60;
function normalizeVwcToPercent(vwc) {
    if (!Number.isFinite(vwc))
        return vwc;
    if (vwc >= 0 && vwc <= 1.2)
        return vwc * 100;
    return vwc;
}
function isValidSoilTexture(value) {
    return typeof value === 'string' && Object.prototype.hasOwnProperty.call(SOIL_WATER_CONSTANTS, value);
}
function safeClampNumber(value, min, max) {
    if (!Number.isFinite(value))
        return value;
    return Math.min(max, Math.max(min, value));
}
function safeDivide(numerator, denominator) {
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0)
        return 0;
    return numerator / denominator;
}
function scoreMoisture(currentVWC, crop, soilTexture) {
    const { vwcMin, vwcOptimal, vwcMax } = crop;
    const soilConstants = SOIL_WATER_CONSTANTS[soilTexture];
    if (!soilConstants)
        return 0;
    const fieldCapacity = soilConstants.FIELD_CAPACITY;
    const wiltingPoint = soilConstants.WILTING_POINT;
    if (!Number.isFinite(currentVWC))
        return 0;
    if (currentVWC > fieldCapacity) {
        const excess = currentVWC - fieldCapacity;
        const excessPenalty = Math.min(excess / 10, 1.0);
        return WEIGHTS.MOISTURE * (1 - excessPenalty) * 0.2;
    }
    if (currentVWC < wiltingPoint) {
        return 0;
    }
    if (Math.abs(currentVWC - vwcOptimal) < 1.0) {
        return WEIGHTS.MOISTURE;
    }
    if (currentVWC >= vwcMin && currentVWC <= vwcMax) {
        const distanceFromOptimal = Math.abs(currentVWC - vwcOptimal);
        const maxDistance = Math.max(vwcOptimal - vwcMin, vwcMax - vwcOptimal);
        const normalizedDistance = safeDivide(distanceFromOptimal, maxDistance);
        const score = WEIGHTS.MOISTURE * (1 - normalizedDistance * 0.4);
        return Math.max(score, WEIGHTS.MOISTURE * 0.6);
    }
    const distanceOutside = currentVWC < vwcMin ? vwcMin - currentVWC : currentVWC - vwcMax;
    const penalty = Math.min(distanceOutside / 10, 1.0);
    return WEIGHTS.MOISTURE * (1 - penalty) * 0.3;
}
function scoreTemperature(currentSoilTemp, crop) {
    const { soilTempMin, soilTempOptimal, soilTempMax } = crop;
    if (!Number.isFinite(currentSoilTemp))
        return 0;
    if (currentSoilTemp >= soilTempMin && currentSoilTemp <= soilTempMax) {
        const distanceFromOptimal = Math.abs(currentSoilTemp - soilTempOptimal);
        const maxDistance = Math.max(soilTempOptimal - soilTempMin, soilTempMax - soilTempOptimal);
        const normalizedDistance = safeDivide(distanceFromOptimal, maxDistance);
        return WEIGHTS.TEMPERATURE * (1 - normalizedDistance * 0.15);
    }
    const distanceOutside = currentSoilTemp < soilTempMin ? soilTempMin - currentSoilTemp : currentSoilTemp - soilTempMax;
    if (distanceOutside > 15)
        return 0;
    const penalty = Math.min(distanceOutside / 15, 1.0);
    return WEIGHTS.TEMPERATURE * (1 - penalty) * 0.4;
}
function scoreSeason(currentSeason, crop) {
    if (crop.season === 'PERENNIAL')
        return WEIGHTS.SEASON;
    return crop.season === currentSeason ? WEIGHTS.SEASON : 0;
}
function scoreSoil(soilTexture, crop) {
    const preferred = crop.soilTexturePreference ?? [];
    if (preferred.includes(soilTexture))
        return WEIGHTS.SOIL;
    const adjacentSoils = {
        SANDY: ['SANDY_LOAM'],
        SANDY_LOAM: ['SANDY', 'LOAM'],
        LOAM: ['SANDY_LOAM', 'CLAY_LOAM'],
        CLAY_LOAM: ['LOAM', 'CLAY'],
        CLAY: ['CLAY_LOAM'],
    };
    const isAdjacent = adjacentSoils[soilTexture]?.some((adj) => preferred.includes(adj));
    return isAdjacent ? WEIGHTS.SOIL * 0.5 : 0;
}
function scoreGDDFeasibility(currentSeason, currentDate, accumulatedGDD, crop) {
    if (crop.season !== currentSeason && crop.season !== 'PERENNIAL')
        return 0;
    const totalGDDRequired = crop.lateSeasonGDD;
    if (!Number.isFinite(totalGDDRequired) || totalGDDRequired <= 0)
        return 0;
    if (Number.isFinite(accumulatedGDD) && accumulatedGDD > totalGDDRequired * 0.25) {
        return WEIGHTS.GDD_FEASIBILITY * 0.2;
    }
    const month = currentDate.getMonth() + 1;
    let daysRemainingInSeason = 0;
    switch (currentSeason) {
        case 'RABI':
            daysRemainingInSeason = month >= 11 ? 120 - (month - 11) * 30 : 90 - (month - 1) * 30;
            break;
        case 'KHARIF':
            daysRemainingInSeason = 150 - (month - 6) * 30;
            break;
        case 'ZAID':
            daysRemainingInSeason = 90 - (month - 3) * 30;
            break;
        case 'PERENNIAL':
            daysRemainingInSeason = 365;
            break;
    }
    daysRemainingInSeason = Math.max(0, daysRemainingInSeason);
    const estimatedCropDurationDays = totalGDDRequired / 15;
    if (daysRemainingInSeason < estimatedCropDurationDays * 0.8)
        return 0;
    if (daysRemainingInSeason < estimatedCropDurationDays * 1.1)
        return WEIGHTS.GDD_FEASIBILITY * 0.6;
    return WEIGHTS.GDD_FEASIBILITY;
}
function generateExplanation(crop, scores, currentVWC, currentSoilTemp, currentSeason, soilTexture) {
    const reasons = [];
    const soilConstants = SOIL_WATER_CONSTANTS[soilTexture];
    if (!soilConstants) {
        reasons.push('soil texture data unavailable for moisture assessment');
    }
    else if (currentVWC < soilConstants.WILTING_POINT) {
        reasons.push(`critical soil moisture deficit (below wilting point: ${soilConstants.WILTING_POINT}%)`);
    }
    else if (currentVWC > soilConstants.FIELD_CAPACITY) {
        reasons.push(`waterlogging risk (above field capacity: ${soilConstants.FIELD_CAPACITY}%)`);
    }
    else if (scores.moisture >= WEIGHTS.MOISTURE * 0.8) {
        reasons.push('excellent soil moisture match');
    }
    else if (scores.moisture >= WEIGHTS.MOISTURE * 0.5) {
        reasons.push('acceptable soil moisture');
    }
    else if (scores.moisture > 0) {
        const status = currentVWC < crop.vwcMin ? 'too dry' : 'too wet';
        reasons.push(`soil moisture ${status} (current: ${currentVWC.toFixed(1)}%, optimal: ${crop.vwcMin}-${crop.vwcMax}%)`);
    }
    else {
        reasons.push('soil moisture unsuitable');
    }
    if (scores.temperature >= WEIGHTS.TEMPERATURE * 0.8) {
        reasons.push('optimal soil temperature');
    }
    else if (scores.temperature >= WEIGHTS.TEMPERATURE * 0.5) {
        reasons.push('acceptable soil temperature');
    }
    else if (scores.temperature > 0) {
        const status = currentSoilTemp < crop.soilTempMin ? 'too cool' : 'too hot';
        reasons.push(`soil temperature ${status} (current: ${currentSoilTemp.toFixed(1)}°C, optimal: ${crop.soilTempMin}-${crop.soilTempMax}°C)`);
    }
    else {
        reasons.push('soil temperature unsuitable');
    }
    if (scores.season > 0) {
        reasons.push(`${String(crop.season).toLowerCase()} season crop`);
    }
    else {
        reasons.push(`wrong season (${String(crop.season).toLowerCase()} crop in ${String(currentSeason).toLowerCase()} season)`);
    }
    const preferred = crop.soilTexturePreference ?? [];
    if (scores.soil === WEIGHTS.SOIL) {
        reasons.push('ideal soil texture');
    }
    else if (scores.soil > 0) {
        reasons.push('acceptable soil texture');
    }
    else {
        reasons.push(`soil not optimal (prefers ${preferred.join('/') || 'N/A'})`);
    }
    if (scores.gddFeasibility === 0 && crop.season !== 'PERENNIAL') {
        reasons.push('insufficient time to complete growth cycle');
    }
    return reasons.join('; ');
}
function calculateCropScore(cropName, crop, currentVWC, currentSoilTemp, currentSeason, currentDate, soilTexture, accumulatedGDD) {
    const scores = {
        moisture: scoreMoisture(currentVWC, crop, soilTexture),
        temperature: scoreTemperature(currentSoilTemp, crop),
        season: scoreSeason(currentSeason, crop),
        soil: scoreSoil(soilTexture, crop),
        gddFeasibility: scoreGDDFeasibility(currentSeason, currentDate, accumulatedGDD, crop),
    };
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const explanation = generateExplanation(crop, scores, currentVWC, currentSoilTemp, currentSeason, soilTexture);
    return {
        cropName,
        totalScore: Number(totalScore.toFixed(1)),
        rank: 0,
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
export async function getCropRecommendations(nodeId) {
    try {
        logger.info({ nodeId }, 'Generating crop recommendations using MCDA (DB-driven crop universe)');
        const field = await getFieldByNodeId(nodeId);
        const reading = await getLatestReading(nodeId);
        if (!reading)
            throw new NotFoundError('SensorReading', `nodeId=${nodeId}`);
        if (reading.soilMoistureVWC === null || reading.soilMoistureVWC === undefined) {
            throw new NotFoundError('SensorReading', `No valid soil moisture for nodeId=${nodeId}`);
        }
        if (reading.soilTemperature === null || reading.soilTemperature === undefined) {
            throw new NotFoundError('SensorReading', `No valid soil temperature for nodeId=${nodeId}`);
        }
        if (!isValidSoilTexture(field.soilTexture)) {
            throw new NotFoundError('Field', `Invalid soilTexture=${String(field.soilTexture)} for nodeId=${nodeId}`);
        }
        const soilTexture = field.soilTexture;
        const currentVWC = normalizeVwcToPercent(Number(reading.soilMoistureVWC));
        const currentSoilTemp = Number(reading.soilTemperature);
        if (!Number.isFinite(currentVWC)) {
            throw new NotFoundError('SensorReading', `Invalid soil moisture value for nodeId=${nodeId}`);
        }
        if (!Number.isFinite(currentSoilTemp)) {
            throw new NotFoundError('SensorReading', `Invalid soil temperature value for nodeId=${nodeId}`);
        }
        const safeVWC = safeClampNumber(currentVWC, 0, 100);
        const safeSoilTemp = safeClampNumber(currentSoilTemp, -10, 70);
        const currentAirTemp = reading.airTemperature ?? 0;
        const accumulatedGDD = field.accumulatedGDD ?? 0;
        const currentSeason = getCurrentSeason();
        const currentDate = new Date();
        const crops = await prisma.cropParameters.findMany({
            where: { validForUP: true },
            orderBy: { cropName: 'asc' },
        });
        if (crops.length === 0) {
            throw new NotFoundError('CropParameters', 'No crops found (validForUP=true). Run prisma seed.');
        }
        const usable = crops.filter((c) => {
            if (isKnownCropName(c.cropName))
                return true;
            logger.warn({ cropName: c.cropName }, 'Skipping DB crop not present in VALID_CROPS typing universe');
            return false;
        });
        if (usable.length === 0) {
            throw new NotFoundError('CropParameters', 'No DB crops match VALID_CROPS typing universe. Update constants.ts or widen CropScore types.');
        }
        const allScores = usable.map((crop) => calculateCropScore(crop.cropName, crop, safeVWC, safeSoilTemp, currentSeason, currentDate, soilTexture, accumulatedGDD));
        allScores.sort((a, b) => b.totalScore - a.totalScore);
        allScores.forEach((score, index) => {
            score.rank = index + 1;
        });
        const topCrop = allScores[0];
        if (!topCrop)
            throw new Error('No crops could be scored (internal error)');
        return {
            nodeId,
            fieldName: field.fieldName,
            currentSeason,
            recommendedCrop: topCrop.cropName,
            topCrops: allScores,
            conditions: {
                currentVWC: safeVWC,
                currentAirTemp,
                currentSoilTemp: safeSoilTemp,
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