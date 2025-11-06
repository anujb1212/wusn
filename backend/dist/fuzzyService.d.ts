interface FuzzyMembership {
    dry: number;
    optimal: number;
    wet: number;
}
interface FuzzyResult {
    recommendation: 'needs_water' | 'optimal' | 'too_wet';
    confidence: number;
    irrigationAdvice: string;
    fuzzyScores: FuzzyMembership;
}
/**
 * Analyze soil conditions using fuzzy logic
 * @param moisture - Soil moisture (0-1000 SMU)
 * @param temperature - Temperature in Celsius
 * @returns Fuzzy analysis result
 */
export declare function analyzeSoilConditions(moisture: number, temperature: number): FuzzyResult;
export {};
//# sourceMappingURL=fuzzyService.d.ts.map