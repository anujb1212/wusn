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
    moistureMatch: number;
    soilMatch: boolean;
    seasonMatch: number;
}
interface CropRecommendation {
    bestCrop: string;
    confidence: number;
    allCrops: CropSuitability[];
    summary: string;
}
/**
 * Generate crop recommendations using ACTUAL soil moisture (VWC%)
 * This REPLACES air humidity from Kaggle dataset with real sensor data
 */
export declare function recommendCropsForUP(nodeId: number, fuzzyResult?: FuzzyResult): Promise<CropRecommendation>;
/**
 * Filter out non-UP crops from any list
 * Use this to clean Kaggle dataset predictions
 */
export declare function filterUPCrops(crops: string[]): string[];
/**
 * Validate conditions for North India (RWCS region)
 */
export declare function validateNorthIndiaConditions(cropName: string, temperature: number, soilMoistureVWC: number): {
    valid: boolean;
    warnings: string[];
};
/**
 * Legacy function for backward compatibility
 * Now uses soil moisture (VWC) instead of raw SMU
 */
export declare function recommendCrop(nodeId: number, fuzzyResult?: FuzzyResult): Promise<CropRecommendation>;
export {};
//# sourceMappingURL=cropRecommendationService.d.ts.map