import { datasetService } from './datasetService.js';

interface FuzzyResult {
    recommendation: 'needs_water' | 'optimal' | 'too_wet';
    confidence: number;
    irrigationAdvice: string;
    fuzzyScores: {
        dry: number;
        optimal: number;
        wet: number;
    };
}

interface CropSuitability {
    cropName: string;
    suitability: number;
    reason: string;
}

interface CropRecommendation {
    bestCrop: string;
    confidence: number;
    allCrops: CropSuitability[];
    summary: string;
}

/**
 * Generate crop recommendations using ICAR dataset + fuzzy logic
 */
export function recommendCrop(
    moisture: number,
    temperature: number,
    fuzzyResult?: FuzzyResult
): CropRecommendation {
    // Get seasonal crops for North India
    const seasonalCrops = datasetService.getSeasonalCrops(temperature);

    // Calculate suitability for each crop
    const crops: CropSuitability[] = seasonalCrops.map(cropName => {
        // Dataset-based suitability score
        const datasetScore = datasetService.calculateCropSuitability(
            moisture,
            temperature,
            cropName
        );

        // If fuzzy logic result available, combine scores
        let finalScore = datasetScore;
        if (fuzzyResult) {
            const fuzzyWeight = 0.4;  // Fuzzy logic weight
            const datasetWeight = 0.6; // ICAR dataset weight

            finalScore = Math.round(
                (fuzzyResult.confidence * fuzzyWeight) +
                (datasetScore * datasetWeight)
            );
        }

        // Generate reason based on score
        let reason: string;
        if (finalScore > 80) {
            reason = 'Excellent: Ideal conditions from ICAR data';
        } else if (finalScore > 60) {
            reason = 'Good: Suitable conditions for cultivation';
        } else if (finalScore > 40) {
            reason = 'Moderate: Acceptable with proper management';
        } else if (finalScore > 20) {
            reason = 'Poor: Sub-optimal conditions, risks involved';
        } else {
            reason = 'Not Recommended: Conditions unfavorable';
        }

        return {
            cropName,
            suitability: finalScore,
            reason
        };
    });

    // Sort by suitability score (highest first)
    crops.sort((a, b) => b.suitability - a.suitability);

    const bestCrop = crops[0]!;
    const secondBest = crops[1];
    const thirdBest = crops[2];

    // Generate summary
    let summary: string;
    const season = temperature < 25 ? 'Rabi (Winter)' : 'Kharif (Monsoon)';

    if (bestCrop.suitability > 80) {
        summary = `${season} season: Highly suitable for ${bestCrop.cropName}. `;
    } else if (bestCrop.suitability > 60) {
        summary = `${season} season: Suitable for ${bestCrop.cropName}. `;
    } else if (bestCrop.suitability > 40) {
        summary = `${season} season: Marginal conditions for ${bestCrop.cropName}. `;
    } else {
        summary = `${season} season: Poor conditions. Consider soil improvement. `;
    }

    // Add alternatives
    const alternatives: string[] = [];
    if (secondBest && secondBest.suitability > 60) {
        alternatives.push(secondBest.cropName);
    }
    if (thirdBest && thirdBest.suitability > 60) {
        alternatives.push(thirdBest.cropName);
    }

    if (alternatives.length > 0) {
        summary += `Alternatives: ${alternatives.join(', ')}.`;
    }

    return {
        bestCrop: bestCrop.cropName,
        confidence: bestCrop.suitability,
        allCrops: crops.slice(0, 5), // Top 5 crops
        summary
    };
}

/**
 * Validate conditions for North India (RWCS region)
 */
export function validateNorthIndiaConditions(
    cropName: string,
    temperature: number,
    moisture: number
): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Rice-Wheat Cropping System (RWCS) specific rules
    if (cropName === 'rice') {
        if (temperature < 20) {
            warnings.push('Rice unsuitable below 20°C in North India');
        }
        if (moisture < 700) {
            warnings.push('Rice requires high moisture (700-900 SMU) in RWCS region');
        }
    }

    if (cropName === 'wheat') {
        if (temperature > 30) {
            warnings.push('High temperature stress for wheat (optimal 15-25°C)');
        }
        if (temperature < 10) {
            warnings.push('Wheat growth stunted below 10°C');
        }
        if (moisture > 700) {
            warnings.push('Excess moisture may cause wheat root rot');
        }
    }

    if (cropName === 'maize') {
        if (temperature < 18) {
            warnings.push('Maize germination poor below 18°C');
        }
    }

    // General extreme warnings
    if (temperature > 40) {
        warnings.push('Extreme heat stress - all crops at risk');
    }
    if (temperature < 5) {
        warnings.push('Freezing risk - protect crops immediately');
    }

    return {
        valid: warnings.length === 0,
        warnings
    };
}
