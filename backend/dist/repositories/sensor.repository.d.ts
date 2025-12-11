/**
 * Sensor Reading Repository
 *
 * Handles CRUD operations for underground sensor measurements
 * Records: soil moisture (VWC), soil temperature, air temperature, air humidity
 *
 * UPDATED: Dec 12, 2025 - Aligned with Prisma schema and service expectations
 */
/**
 * Sensor reading input type
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
/**
 * Filters for querying sensor readings
 */
export interface SensorReadingFilters {
    nodeId?: number;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}
/**
 * Create a new sensor reading
 *
 * @param input - Sensor reading data
 * @returns Created sensor reading
 */
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
/**
 * Get latest sensor reading for a node
 *
 * @param nodeId - Sensor node ID
 * @returns Latest reading or null
 */
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
/**
 * Get sensor readings with filters
 *
 * @param filters - Query filters
 * @returns Array of sensor readings
 */
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
/**
 * Get average soil readings over time period
 *
 * @param nodeId - Sensor node ID
 * @param hours - Number of hours to average (default: 24)
 * @returns Average soil moisture and temperature
 */
export declare function getAverageSoilReadings(nodeId: number, hours?: number): Promise<{
    avgSoilMoistureVWC: number;
    avgSoilTemperature: number;
    readingsCount: number;
    periodHours: number;
} | null>;
/**
 * Get average air readings over time period
 *
 * Includes air temperature, humidity, and pressure (if available)
 *
 * @param nodeId - Sensor node ID
 * @param hours - Number of hours to average (default: 24)
 * @returns Average air temperature, humidity, and pressure
 */
export declare function getAverageAirReadings(nodeId: number, hours?: number): Promise<{
    avgAirTemperature: number;
    avgAirHumidity: number;
    avgAirPressure: number | null;
    readingsCount: number;
    periodHours: number;
} | null>;
/**
 * Get readings count for a node
 *
 * @param nodeId - Sensor node ID
 * @returns Total count of readings
 */
export declare function getReadingsCount(nodeId: number): Promise<number>;
/**
 * Delete old sensor readings (maintenance)
 *
 * @param olderThanDays - Delete readings older than this many days
 * @returns Number of deleted records
 */
export declare function deleteOldReadings(olderThanDays: number): Promise<number>;
//# sourceMappingURL=sensor.repository.d.ts.map