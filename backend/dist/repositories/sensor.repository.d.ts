/**
 * Sensor Reading Repository
 */
export interface CreateSensorReadingInput {
    nodeId: number;
    moisture: number;
    temperature: number;
    soilMoistureVWC: number;
    soilTemperature: number;
    timestamp: Date;
}
export interface SensorReadingFilters {
    nodeId?: number;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}
/**
 * Create sensor reading
 */
export declare function createSensorReading(input: CreateSensorReadingInput): Promise<{
    timestamp: Date;
    moisture: number;
    temperature: number;
    soilMoistureVWC: number | null;
    soilTemperature: number | null;
    rssi: number | null;
    batteryLevel: number | null;
    id: number;
    nodeId: number;
}>;
/**
 * Get latest reading
 */
export declare function getLatestReading(nodeId: number): Promise<{
    timestamp: Date;
    moisture: number;
    temperature: number;
    soilMoistureVWC: number | null;
    soilTemperature: number | null;
    rssi: number | null;
    batteryLevel: number | null;
    id: number;
    nodeId: number;
} | null>;
/**
 * Get readings with filters
 */
export declare function getReadings(filters: SensorReadingFilters): Promise<{
    timestamp: Date;
    moisture: number;
    temperature: number;
    soilMoistureVWC: number | null;
    soilTemperature: number | null;
    rssi: number | null;
    batteryLevel: number | null;
    id: number;
    nodeId: number;
}[]>;
/**
 * Get readings for date
 */
export declare function getReadingsForDate(nodeId: number, date: Date): Promise<{
    timestamp: Date;
    moisture: number;
    temperature: number;
    soilMoistureVWC: number | null;
    soilTemperature: number | null;
    rssi: number | null;
    batteryLevel: number | null;
    id: number;
    nodeId: number;
}[]>;
/**
 * Get average readings
 */
export declare function getAverageReadings(nodeId: number, hours?: number): Promise<{
    avgSoilMoistureVWC: number;
    avgSoilTemperature: number;
    readingsCount: number;
} | null>;
/**
 * Delete old readings
 */
export declare function deleteOldReadings(daysToKeep?: number): Promise<number>;
//# sourceMappingURL=sensor.repository.d.ts.map