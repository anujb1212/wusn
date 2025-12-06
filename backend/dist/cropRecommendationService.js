import { PrismaClient } from '@prisma/client';
import { UP_VALID_CROPS, getCropBaseTemp, getCropGDDRequirement } from './gddService.js';
const prisma = new PrismaClient();
const CROP_MOISTURE_REQUIREMENTS = {
    rice: { min: 60, optimal: 70, max: 80 }, // Flooded paddy conditions
    chickpea: { min: 25, optimal: 35, max: 45 }, // Drought tolerant
    lentil: { min: 25, optimal: 35, max: 45 }, // Drought tolerant
    cotton: { min: 35, optimal: 45, max: 55 }, // Moderate to high
    maize: { min: 40, optimal: 50, max: 60 }, // High moisture demand
    pigeonpeas: { min: 30, optimal: 40, max: 50 }, // Moderate
    mothbeans: { min: 20, optimal: 30, max: 40 }, // Drought resistant
    mungbean: { min: 30, optimal: 40, max: 50 }, // Moderate
    blackgram: { min: 30, optimal: 40, max: 50 }, // Moderate
    kidneybeans: { min: 35, optimal: 45, max: 55 }, // Moderate to high
    watermelon: { min: 40, optimal: 50, max: 60 }, // High moisture
    muskmelon: { min: 40, optimal: 50, max: 60 }, // High moisture
};
const CROP_SOIL_SUITABILITY = {
    rice: ['CLAY_LOAM', 'LOAM', 'SANDY_LOAM'],
    chickpea: ['SANDY_LOAM', 'LOAM'], // Well-drained preferred
    lentil: ['SANDY_LOAM', 'LOAM'], // Well-drained preferred
    cotton: ['SANDY_LOAM', 'CLAY_LOAM', 'LOAM'],
    maize: ['LOAM', 'SANDY_LOAM'],
    pigeonpeas: ['SANDY_LOAM', 'LOAM'],
    mothbeans: ['SANDY', 'SANDY_LOAM'], // Tolerates poor soil
    mungbean: ['SANDY_LOAM', 'LOAM'],
    blackgram: ['SANDY_LOAM', 'LOAM'],
    kidneybeans: ['LOAM', 'SANDY_LOAM'],
    watermelon: ['SANDY_LOAM', 'LOAM'],
    muskmelon: ['SANDY_LOAM', 'LOAM'],
};
/**
 * Determine current cropping season based on month
 * UP follows three seasons: Kharif (monsoon), Rabi (winter), Zaid (summer)
 */
function getCurrentSeason() {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    if (currentMonth >= 6 && currentMonth <= 10) {
        return 'KHARIF'; // June-October (monsoon season)
    }
    else if (currentMonth >= 11 || currentMonth <= 3) {
        return 'RABI'; // November-March (winter season)
    }
    else {
        return 'ZAID'; // April-May (summer season)
    }
}
/**
 * Crop-season suitability mapping
 * 1.0 = perfect season, 0.5 = can grow but suboptimal, 0.0 = wrong season
 */
const CROP_SEASON_SUITABILITY = {
    rice: { KHARIF: 1.0, RABI: 0.0, ZAID: 0.0 },
    chickpea: { KHARIF: 0.0, RABI: 1.0, ZAID: 0.0 },
    lentil: { KHARIF: 0.0, RABI: 1.0, ZAID: 0.0 },
    cotton: { KHARIF: 1.0, RABI: 0.0, ZAID: 0.0 },
    maize: { KHARIF: 1.0, RABI: 0.5, ZAID: 0.7 }, // Can grow multiple seasons
    pigeonpeas: { KHARIF: 1.0, RABI: 0.0, ZAID: 0.0 },
    mothbeans: { KHARIF: 1.0, RABI: 0.0, ZAID: 0.5 },
    mungbean: { KHARIF: 1.0, RABI: 0.0, ZAID: 0.7 },
    blackgram: { KHARIF: 1.0, RABI: 0.0, ZAID: 0.5 },
    kidneybeans: { KHARIF: 1.0, RABI: 0.5, ZAID: 0.0 },
    watermelon: { KHARIF: 0.5, RABI: 0.0, ZAID: 1.0 },
    muskmelon: { KHARIF: 0.5, RABI: 0.0, ZAID: 1.0 },
};
/**
 * Generate crop recommendations using ACTUAL soil moisture (VWC%)
 * This REPLACES air humidity from Kaggle dataset with real sensor data
 */
export async function recommendCropsForUP(nodeId, fuzzyResult) {
    try {
        console.log(`[CropRec] 🌾 Generating recommendations for node ${nodeId}`);
        // Get field configuration
        const fieldConfig = await prisma.fieldConfig.findUnique({
            where: { nodeId },
        });
        const soilTexture = fieldConfig?.soilTexture || 'SANDY_LOAM';
        const oneDayAgo = new Date();
        oneDayAgo.setHours(oneDayAgo.getHours() - 24);
        let recentReadings = await prisma.sensorReading.findMany({
            where: {
                nodeId,
                timestamp: { gte: oneDayAgo },
                soilMoistureVWC: { not: null },
                soilTemperature: { not: null },
            },
            select: {
                soilMoistureVWC: true,
                soilTemperature: true,
            },
            orderBy: { timestamp: 'desc' },
        });
        if (recentReadings.length === 0) {
            console.log('[CropRec] No readings in last 24h, fetching latest 10...');
            recentReadings = await prisma.sensorReading.findMany({
                where: {
                    nodeId,
                    soilMoistureVWC: { not: null },
                    soilTemperature: { not: null },
                },
                select: {
                    soilMoistureVWC: true,
                    soilTemperature: true,
                },
                orderBy: { timestamp: 'desc' },
                take: 10,
            });
        }
        if (recentReadings.length === 0) {
            throw new Error(`No sensor data available for node ${nodeId}`);
        }
        // Calculate averages
        const avgSoilMoisture = recentReadings.reduce((sum, r) => sum + (r.soilMoistureVWC || 0), 0) /
            recentReadings.length;
        const avgSoilTemp = recentReadings.reduce((sum, r) => sum + (r.soilTemperature || 0), 0) /
            recentReadings.length;
        console.log(`[CropRec] Avg (${recentReadings.length} readings): ${avgSoilMoisture.toFixed(2)}% VWC, ` +
            `${avgSoilTemp.toFixed(2)}°C, Soil: ${soilTexture}`);
        // Rest of the function remains same...
        const currentSeason = getCurrentSeason();
        console.log(`[CropRec] Current season: ${currentSeason}`);
        const crops = [];
        for (const cropName of UP_VALID_CROPS) {
            const moistureReq = CROP_MOISTURE_REQUIREMENTS[cropName];
            const soilSuitability = CROP_SOIL_SUITABILITY[cropName] || [];
            const seasonSuitability = CROP_SEASON_SUITABILITY[cropName] || {};
            if (!moistureReq)
                continue;
            const reasons = [];
            let suitabilityScore = 0;
            // 1. Soil moisture match (40% weight)
            const moistureMatch = calculateMoistureMatch(avgSoilMoisture, moistureReq);
            suitabilityScore += moistureMatch * 40;
            if (moistureMatch > 0.8) {
                reasons.push(`Excellent soil moisture (${avgSoilMoisture.toFixed(1)}% VWC)`);
            }
            else if (moistureMatch > 0.6) {
                reasons.push(`Good soil moisture (${avgSoilMoisture.toFixed(1)}% VWC)`);
            }
            else if (moistureMatch > 0.3) {
                reasons.push(`Moderate soil moisture (${avgSoilMoisture.toFixed(1)}% VWC)`);
            }
            else {
                reasons.push(`Poor soil moisture (${avgSoilMoisture.toFixed(1)}% VWC, needs ${moistureReq.min}-${moistureReq.max}%)`);
            }
            // 2. Soil texture match (30% weight)
            const soilMatch = soilSuitability.includes(soilTexture);
            if (soilMatch) {
                suitabilityScore += 30;
                reasons.push(`Suitable for ${soilTexture} soil`);
            }
            else {
                reasons.push(`Suboptimal for ${soilTexture} soil`);
            }
            // 3. Season appropriateness (30% weight)
            const seasonScore = seasonSuitability[currentSeason] || 0.5;
            suitabilityScore += seasonScore * 30;
            if (seasonScore >= 1.0) {
                reasons.push(`Perfect season (${currentSeason})`);
            }
            else if (seasonScore >= 0.5) {
                reasons.push(`Can grow in ${currentSeason} (suboptimal)`);
            }
            else {
                reasons.push(`Wrong season (${currentSeason})`);
            }
            // Combine with fuzzy result if available
            if (fuzzyResult) {
                const fuzzyAdjustment = (fuzzyResult.confidence / 100) * 10;
                suitabilityScore += fuzzyAdjustment;
            }
            // Clamp to 0-100
            suitabilityScore = Math.max(0, Math.min(100, suitabilityScore));
            crops.push({
                cropName,
                suitability: Math.round(suitabilityScore),
                reason: reasons.join('; '),
                moistureMatch,
                soilMatch,
                seasonMatch: seasonScore,
            });
        }
        // Sort by suitability
        crops.sort((a, b) => b.suitability - a.suitability);
        const bestCrop = crops[0];
        const alternatives = crops.slice(1, 3).filter((c) => c.suitability > 60);
        const summary = generateSummary(bestCrop, alternatives, currentSeason);
        console.log(`[CropRec] ✅ Top recommendation: ${bestCrop.cropName} (${bestCrop.suitability}%)`);
        return {
            bestCrop: bestCrop.cropName,
            confidence: bestCrop.suitability,
            allCrops: crops.slice(0, 5),
            summary,
        };
    }
    catch (error) {
        console.error(`[CropRec] ❌ Error generating recommendations:`, error);
        throw error;
    }
}
/**
 * Calculate moisture match score (0-1)
 * Uses Gaussian distribution centered on optimal moisture
 */
function calculateMoistureMatch(actualVWC, requirement) {
    const { min, optimal, max } = requirement;
    if (actualVWC < min || actualVWC > max) {
        // Out of acceptable range - apply penalty
        const distanceFromRange = actualVWC < min ? min - actualVWC : actualVWC - max;
        return Math.max(0, 1 - distanceFromRange / 20); // Penalty decreases with distance
    }
    // Within range - calculate distance from optimal
    const distanceFromOptimal = Math.abs(actualVWC - optimal);
    const rangeWidth = (max - min) / 2;
    // Gaussian-like score: closer to optimal = higher score
    return Math.max(0, 1 - (distanceFromOptimal / rangeWidth) * 0.5);
}
/**
 * Generate human-readable summary
 */
function generateSummary(bestCrop, alternatives, season) {
    let summary = `${season} season: `;
    if (bestCrop.suitability > 80) {
        summary += `Highly suitable for ${bestCrop.cropName}. `;
    }
    else if (bestCrop.suitability > 60) {
        summary += `Suitable for ${bestCrop.cropName}. `;
    }
    else if (bestCrop.suitability > 40) {
        summary += `Marginal conditions for ${bestCrop.cropName}. `;
    }
    else {
        summary += `Poor conditions. Consider soil improvement. `;
    }
    if (alternatives.length > 0) {
        const altNames = alternatives.map((c) => c.cropName).join(', ');
        summary += `Alternatives: ${altNames}.`;
    }
    return summary;
}
/**
 * Filter out non-UP crops from any list
 * Use this to clean Kaggle dataset predictions
 */
export function filterUPCrops(crops) {
    return crops.filter((crop) => {
        const normalized = crop.toLowerCase().replace(/\s+/g, '');
        return UP_VALID_CROPS.includes(normalized);
    });
}
/**
 * Validate conditions for North India (RWCS region)
 */
export function validateNorthIndiaConditions(cropName, temperature, soilMoistureVWC) {
    const warnings = [];
    const normalizedCrop = cropName.toLowerCase().replace(/\s+/g, '');
    // Rice-Wheat Cropping System (RWCS) specific rules
    if (normalizedCrop === 'rice') {
        if (temperature < 20) {
            warnings.push('Rice unsuitable below 20°C in North India');
        }
        if (soilMoistureVWC < 60) {
            warnings.push('Rice requires high moisture (60-80% VWC) in RWCS region');
        }
    }
    if (normalizedCrop === 'chickpea') {
        if (temperature > 30) {
            warnings.push('High temperature stress for chickpea (optimal 18-25°C)');
        }
        if (temperature < 10) {
            warnings.push('Chickpea growth stunted below 10°C');
        }
        if (soilMoistureVWC > 45) {
            warnings.push('Excess moisture may cause chickpea root rot');
        }
    }
    if (normalizedCrop === 'lentil') {
        if (temperature > 30) {
            warnings.push('High temperature stress for lentil (optimal 18-25°C)');
        }
        if (soilMoistureVWC > 45) {
            warnings.push('Excess moisture may cause lentil root diseases');
        }
    }
    if (normalizedCrop === 'maize') {
        if (temperature < 18) {
            warnings.push('Maize germination poor below 18°C');
        }
        if (soilMoistureVWC < 40) {
            warnings.push('Maize requires consistent moisture (40-60% VWC)');
        }
    }
    // General extreme warnings
    if (temperature > 40) {
        warnings.push('Extreme heat stress - all crops at risk');
    }
    if (temperature < 5) {
        warnings.push('Freezing risk - protect crops immediately');
    }
    if (soilMoistureVWC < 10) {
        warnings.push('Critical drought - immediate irrigation needed');
    }
    if (soilMoistureVWC > 70) {
        warnings.push('Waterlogging risk - improve drainage');
    }
    return {
        valid: warnings.length === 0,
        warnings,
    };
}
/**
 * Legacy function for backward compatibility
 * Now uses soil moisture (VWC) instead of raw SMU
 */
export async function recommendCrop(nodeId, fuzzyResult) {
    return await recommendCropsForUP(nodeId, fuzzyResult);
}
//# sourceMappingURL=cropRecommendationService.js.map