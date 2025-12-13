/**
 * Sensor Reading Repository
 */
export interface SensorReadingInput {
    nodeId: number;
    moisture: number;
    temperature: number;
    soilMoistureVWC: number;
    soilTemperature: number;
    airTemperature: number;
    airHumidity: number;
    airPressure?: number;
    timestamp?: Date;
}
export interface SensorReadingFilters {
    nodeId?: number;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}
export declare function createSensorReading(input: SensorReadingInput): Promise<{
    timestamp: Date;
    moisture: number;
    temperature: number;
    soilMoistureVWC: number;
    soilTemperature: number;
    airTemperature: number;
    airHumidity: number;
    airPressure: number | null;
    id: number;
    nodeId: number;
}>;
export declare function getLatestReading(nodeId: number): Promise<{
    timestamp: Date;
    moisture: number;
    temperature: number;
    soilMoistureVWC: number;
    soilTemperature: number;
    airTemperature: number;
    airHumidity: number;
    airPressure: number | null;
    id: number;
    nodeId: number;
} | null>;
export declare function getReadings(filters: SensorReadingFilters): Promise<{
    timestamp: Date;
    moisture: number;
    temperature: number;
    soilMoistureVWC: number;
    soilTemperature: number;
    airTemperature: number;
    airHumidity: number;
    airPressure: number | null;
    id: number;
    nodeId: number;
}[]>;
export declare function getAverageSoilReadings(nodeId: number, hours?: number): Promise<{
    avgSoilMoistureVWC: number;
    avgSoilTemperature: number;
    readingsCount: number;
    periodHours: number;
} | null>;
export declare function getAverageAirReadings(nodeId: number, hours?: number): Promise<{
    avgAirTemperature: number;
    avgAirHumidity: number;
    avgAirPressure: number | null;
    readingsCount: number;
    periodHours: number;
} | null>;
export declare function getReadingsCount(nodeId: number): Promise<number>;
export declare function deleteOldReadings(olderThanDays: number): Promise<number>;
//# sourceMappingURL=sensor.repository.d.ts.map