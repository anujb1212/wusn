interface CropRange {
    crop: string;
    tempMin: number;
    tempMax: number;
    tempIdeal: number;
    humidityMin: number;
    humidityMax: number;
    humidityIdeal: number;
    phMin: number;
    phMax: number;
    rainfallMin: number;
    rainfallMax: number;
}
declare class DatasetService {
    private cropData;
    private cropRanges;
    private northIndiaCrops;
    constructor();
    /**
     * Load CSV file once at startup (manual parsing - most reliable)
     */
    private loadDataset;
    /**
     * Preprocess dataset into min/max/ideal ranges per crop
     */
    private preprocessRanges;
    /**
     * Calculate crop suitability using ICAR dataset
     * @param moisture - Soil moisture (0-1000 SMU)
     * @param temperature - Temperature in Celsius
     * @param cropName - Crop name from dataset
     * @returns Suitability score (0-100)
     */
    calculateCropSuitability(moisture: number, temperature: number, cropName: string): number;
    /**
     * Get suitable crops for North India based on seasonal filtering
     * @param temperature - Current temperature
     * @returns Array of crop names suitable for season
     */
    getSeasonalCrops(temperature: number): string[];
    /**
     * Get all available crops in dataset
     */
    getAllCrops(): string[];
    /**
     * Get crop ideal conditions
     */
    getCropIdealConditions(cropName: string): CropRange | undefined;
    /**
     * Get dataset statistics
     */
    getDatasetStats(): {
        totalRecords: number;
        totalCrops: number;
        cropList: string[];
        northIndiaCropsAvailable: string[];
    };
}
export declare const datasetService: DatasetService;
export {};
//# sourceMappingURL=datasetService.d.ts.map