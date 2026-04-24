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
export declare function createGDDRecord(input: CreateGDDRecordInput): Promise<{
    id: number;
    cropType: string | null;
    baseTemperature: number;
    createdAt: Date;
    date: Date;
    readingsCount: number;
    avgAirTemp: number;
    minAirTemp: number | null;
    maxAirTemp: number | null;
    growthStage: import(".prisma/client").$Enums.GrowthStage | null;
    fieldId: number;
    dailyGDD: number;
    cumulativeGDD: number;
}>;
export declare function getGDDRecordForDate(fieldId: number, date: Date): Promise<{
    id: number;
    cropType: string | null;
    baseTemperature: number;
    createdAt: Date;
    date: Date;
    readingsCount: number;
    avgAirTemp: number;
    minAirTemp: number | null;
    maxAirTemp: number | null;
    growthStage: import(".prisma/client").$Enums.GrowthStage | null;
    fieldId: number;
    dailyGDD: number;
    cumulativeGDD: number;
} | null>;
export declare function getGDDRecordsSinceSowing(fieldId: number, sowingDate: Date): Promise<{
    id: number;
    cropType: string | null;
    baseTemperature: number;
    createdAt: Date;
    date: Date;
    readingsCount: number;
    avgAirTemp: number;
    minAirTemp: number | null;
    maxAirTemp: number | null;
    growthStage: import(".prisma/client").$Enums.GrowthStage | null;
    fieldId: number;
    dailyGDD: number;
    cumulativeGDD: number;
}[]>;
export declare function getLatestGDDRecord(fieldId: number): Promise<{
    id: number;
    cropType: string | null;
    baseTemperature: number;
    createdAt: Date;
    date: Date;
    readingsCount: number;
    avgAirTemp: number;
    minAirTemp: number | null;
    maxAirTemp: number | null;
    growthStage: import(".prisma/client").$Enums.GrowthStage | null;
    fieldId: number;
    dailyGDD: number;
    cumulativeGDD: number;
} | null>;
export declare function deleteGDDRecordsInRange(fieldId: number, startDate: Date, endDate: Date): Promise<number>;
export declare function getCumulativeGDD(fieldId: number): Promise<number>;
//# sourceMappingURL=gdd.repository.d.ts.map