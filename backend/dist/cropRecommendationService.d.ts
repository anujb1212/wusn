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
export declare function recommendCrop(moisture: number, temperature: number): CropRecommendation;
export {};
//# sourceMappingURL=cropRecommendationService.d.ts.map