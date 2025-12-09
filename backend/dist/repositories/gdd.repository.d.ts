/**
 * GDD (Growing Degree Days) Repository
 */
export interface CreateGDDRecordInput {
    fieldId: number;
    date: Date;
    avgAirTemp: number;
    minAirTemp?: number | undefined;
    maxAirTemp?: number | undefined;
    readingsCount: number;
    dailyGDD: number;
    cumulativeGDD: number;
    cropType?: string | undefined;
    baseTemperature: number;
    growthStage?: string | undefined;
}
/**
 * Create GDD record
 */
export declare function createGDDRecord(input: CreateGDDRecordInput): Promise<{
    id: number;
    cropType: string | null;
    baseTemperature: number;
    createdAt: Date;
    date: Date;
    avgAirTemp: number;
    minAirTemp: number | null;
    maxAirTemp: number | null;
    readingsCount: number;
    dailyGDD: number;
    cumulativeGDD: number;
    growthStage: string | null;
    fieldId: number;
}>;
/**
 * Get GDD record for specific date
 */
export declare function getGDDRecordForDate(fieldId: number, date: Date): Promise<{
    id: number;
    cropType: string | null;
    baseTemperature: number;
    createdAt: Date;
    date: Date;
    avgAirTemp: number;
    minAirTemp: number | null;
    maxAirTemp: number | null;
    readingsCount: number;
    dailyGDD: number;
    cumulativeGDD: number;
    growthStage: string | null;
    fieldId: number;
} | null>;
/**
 * Get all GDD records for field since sowing
 */
export declare function getGDDRecordsSinceSowing(fieldId: number, sowingDate: Date): Promise<{
    id: number;
    cropType: string | null;
    baseTemperature: number;
    createdAt: Date;
    date: Date;
    avgAirTemp: number;
    minAirTemp: number | null;
    maxAirTemp: number | null;
    readingsCount: number;
    dailyGDD: number;
    cumulativeGDD: number;
    growthStage: string | null;
    fieldId: number;
}[]>;
/**
 * Get latest GDD record
 */
export declare function getLatestGDDRecord(fieldId: number): Promise<{
    id: number;
    cropType: string | null;
    baseTemperature: number;
    createdAt: Date;
    date: Date;
    avgAirTemp: number;
    minAirTemp: number | null;
    maxAirTemp: number | null;
    readingsCount: number;
    dailyGDD: number;
    cumulativeGDD: number;
    growthStage: string | null;
    fieldId: number;
} | null>;
/**
 * Delete GDD records for date range
 */
export declare function deleteGDDRecordsInRange(fieldId: number, startDate: Date, endDate: Date): Promise<number>;
/**
 * Get cumulative GDD for field
 */
export declare function getCumulativeGDD(fieldId: number): Promise<number>;
//# sourceMappingURL=gdd.repository.d.ts.map