import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES Module compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface CropDataRow {
    N: number;
    P: number;
    K: number;
    temperature: number;
    humidity: number;
    ph: number;
    rainfall: number;
    label: string;
}

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

class DatasetService {
    private cropData: CropDataRow[] = [];
    private cropRanges: Map<string, CropRange> = new Map();
    private northIndiaCrops = [
        'rice', 'wheat', 'maize', 'chickpea', 'pigeonpeas',
        'mungbean', 'mothbeans', 'kidneybeans', 'lentil',
        'cotton', 'pomegranate', 'muskmelon', 'watermelon'
    ];

    constructor() {
        this.loadDataset();
        this.preprocessRanges();
    }

    /**
     * Load CSV file once at startup (manual parsing - most reliable)
     */
    private loadDataset(): void {
        try {
            const csvPath = path.join(__dirname, '../data/crop_recommendation.csv');
            console.log(`📂 Looking for dataset at: ${csvPath}`);

            const csvContent = fs.readFileSync(csvPath, 'utf-8');

            // Remove BOM if present
            const cleanContent = csvContent.replace(/^\uFEFF/, '');

            // Split into lines
            const lines = cleanContent.split('\n');

            // Skip header (first line) and filter empty lines
            const dataLines = lines.slice(1).filter(line => line.trim().length > 0);

            // Manual parsing for reliability
            this.cropData = dataLines.map((line, index) => {
                try {
                    const parts = line.split(',').map(part => part.trim());

                    if (parts.length < 8) {
                        console.warn(`⚠️  Skipping malformed line ${index + 2}: insufficient columns`);
                        return null;
                    }

                    return {
                        N: parseFloat(parts[0] || '0') || 0,
                        P: parseFloat(parts[1] || '0') || 0,
                        K: parseFloat(parts[2] || '0') || 0,
                        temperature: parseFloat(parts[3] || '0') || 0,
                        humidity: parseFloat(parts[4] || '0') || 0,
                        ph: parseFloat(parts[5] || '0') || 0,
                        rainfall: parseFloat(parts[6] || '0') || 0,
                        label: (parts[7] || 'unknown').toLowerCase().trim()
                    };
                } catch (err) {
                    console.warn(`⚠️  Error parsing line ${index + 2}:`, err);
                    return null;
                }
            }).filter((record): record is CropDataRow => record !== null);

            console.log(`✅ Loaded ${this.cropData.length} crop records from ICAR dataset`);

            // Show sample for debugging
            if (this.cropData.length > 0) {
                console.log('📊 Sample record:', this.cropData[0]);
            }
        } catch (error) {
            console.error('❌ Error loading crop dataset:', error);
            console.error('📂 Make sure crop_recommendation.csv exists at: backend/data/');
            throw new Error('Failed to load crop_recommendation.csv');
        }
    }

    /**
     * Preprocess dataset into min/max/ideal ranges per crop
     */
    private preprocessRanges(): void {
        const cropGroups = new Map<string, CropDataRow[]>();

        // Group by crop name
        this.cropData.forEach(record => {
            if (!cropGroups.has(record.label)) {
                cropGroups.set(record.label, []);
            }
            cropGroups.get(record.label)!.push(record);
        });

        // Calculate ranges for each crop
        cropGroups.forEach((records, cropName) => {
            const temps = records.map(r => r.temperature);
            const humidities = records.map(r => r.humidity);
            const phs = records.map(r => r.ph);
            const rainfalls = records.map(r => r.rainfall);

            this.cropRanges.set(cropName, {
                crop: cropName,
                tempMin: Math.min(...temps),
                tempMax: Math.max(...temps),
                tempIdeal: temps.reduce((a, b) => a + b) / temps.length,
                humidityMin: Math.min(...humidities),
                humidityMax: Math.max(...humidities),
                humidityIdeal: humidities.reduce((a, b) => a + b) / humidities.length,
                phMin: Math.min(...phs),
                phMax: Math.max(...phs),
                rainfallMin: Math.min(...rainfalls),
                rainfallMax: Math.max(...rainfalls)
            });
        });

        console.log(`✅ Preprocessed ranges for ${this.cropRanges.size} crops`);
        console.log(`📋 Available crops: ${Array.from(this.cropRanges.keys()).join(', ')}`);
    }

    /**
     * Calculate crop suitability using ICAR dataset
     * @param moisture - Soil moisture (0-1000 SMU)
     * @param temperature - Temperature in Celsius
     * @param cropName - Crop name from dataset
     * @returns Suitability score (0-100)
     */
    public calculateCropSuitability(
        moisture: number,
        temperature: number,
        cropName: string
    ): number {
        const range = this.cropRanges.get(cropName);
        if (!range) {
            console.warn(`⚠️  Crop '${cropName}' not found in dataset`);
            return 0;
        }

        // Convert SMU to approximate humidity percentage
        // SMU 0-1000 maps to roughly 0-100% humidity
        const estimatedHumidity = moisture / 10;

        // Temperature score (0-100)
        let tempScore = 0;
        if (temperature >= range.tempMin && temperature <= range.tempMax) {
            const deviation = Math.abs(temperature - range.tempIdeal);
            const maxDeviation = Math.max(
                range.tempIdeal - range.tempMin,
                range.tempMax - range.tempIdeal
            );
            tempScore = 100 * (1 - deviation / maxDeviation);
        } else {
            // Penalty for out of range
            const outOfRangeDistance = Math.min(
                Math.abs(temperature - range.tempMin),
                Math.abs(temperature - range.tempMax)
            );
            tempScore = Math.max(0, 100 - outOfRangeDistance * 5);
        }

        // Humidity score (approximate)
        let humidityScore = 0;
        if (estimatedHumidity >= range.humidityMin && estimatedHumidity <= range.humidityMax) {
            const deviation = Math.abs(estimatedHumidity - range.humidityIdeal);
            const maxDeviation = Math.max(
                range.humidityIdeal - range.humidityMin,
                range.humidityMax - range.humidityIdeal
            );
            humidityScore = 100 * (1 - deviation / maxDeviation);
        } else {
            const outOfRangeDistance = Math.min(
                Math.abs(estimatedHumidity - range.humidityMin),
                Math.abs(estimatedHumidity - range.humidityMax)
            );
            humidityScore = Math.max(0, 100 - outOfRangeDistance * 2);
        }

        // Weighted average (temperature is more reliable than moisture-derived humidity)
        const finalScore = tempScore * 0.7 + humidityScore * 0.3;

        return Math.round(Math.max(0, Math.min(100, finalScore)));
    }

    /**
     * Get suitable crops for North India based on seasonal filtering
     * @param temperature - Current temperature
     * @returns Array of crop names suitable for season
     */
    public getSeasonalCrops(temperature: number): string[] {
        // Filter only crops that exist in dataset
        const availableCrops = this.northIndiaCrops.filter(crop =>
            this.cropRanges.has(crop)
        );

        // Seasonal filtering for North India
        if (temperature < 25) {
            // Rabi season (Oct-April): Cool season crops
            const rabiCrops = availableCrops.filter(c =>
                ['wheat', 'chickpea', 'lentil', 'mothbeans', 'pomegranate'].includes(c)
            );

            // If no rabi crops, return all available
            return rabiCrops.length > 0 ? rabiCrops : availableCrops.slice(0, 5);
        } else {
            // Kharif season (June-Oct): Warm season crops
            const kharifCrops = availableCrops.filter(c =>
                ['rice', 'maize', 'cotton', 'mungbean', 'pigeonpeas',
                    'kidneybeans', 'muskmelon', 'watermelon'].includes(c)
            );

            // If no kharif crops, return all available
            return kharifCrops.length > 0 ? kharifCrops : availableCrops.slice(0, 5);
        }
    }

    /**
     * Get all available crops in dataset
     */
    public getAllCrops(): string[] {
        return Array.from(this.cropRanges.keys());
    }

    /**
     * Get crop ideal conditions
     */
    public getCropIdealConditions(cropName: string): CropRange | undefined {
        return this.cropRanges.get(cropName);
    }

    /**
     * Get dataset statistics
     */
    public getDatasetStats() {
        return {
            totalRecords: this.cropData.length,
            totalCrops: this.cropRanges.size,
            cropList: this.getAllCrops(),
            northIndiaCropsAvailable: this.northIndiaCrops.filter(c => this.cropRanges.has(c))
        };
    }
}

// Singleton instance
export const datasetService = new DatasetService();
