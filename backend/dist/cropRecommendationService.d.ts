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
export declare function recommendCrop(moisture: number, temperature: number, fuzzyResult?: FuzzyResult): CropRecommendation;
/**
 * Validate conditions for North India (RWCS region)
 */
export declare function validateNorthIndiaConditions(cropName: string, temperature: number, moisture: number): {
    valid: boolean;
    warnings: string[];
};
export {};
//# sourceMappingURL=cropRecommendationService.d.ts.map