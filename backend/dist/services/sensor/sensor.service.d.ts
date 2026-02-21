/**
 * Sensor Data Processing Service
 *
 * Handles incoming sensor payloads from MQTT gateway
 * Performs calibration and stores data in database
 */
import type { SensorPayload, ProcessedSensorData } from '../../models/common.types.js';
/**
 * Process incoming sensor data from gateway
 *
 * Performs:
 * 1. Field lookup/creation
 * 2. Soil moisture calibration (raw → VWC%)
 * 3. Temperature validation
 * 4. Data storage
 *
 * @param payload - Validated sensor payload from MQTT
 * @returns Processed sensor data
 */
export declare function processSensorData(payload: SensorPayload): Promise<ProcessedSensorData>;
/**
 * Get latest sensor data for a node
 * Includes both soil and air measurements
 *
 * @param nodeId - Sensor node ID
 * @returns Latest reading or null
 */
export declare function getLatestSensorData(nodeId: number): Promise<{
    nodeId: number;
    soilMoistureVWC: number;
    soilTemperature: number;
    airTemperature: number;
    airHumidity: number;
    airPressure: number | null;
    timestamp: Date;
} | null>;
/**
 * Get average soil measurements over time period
 *
 * @param nodeId - Sensor node ID
 * @param hours - Time window in hours (default 24)
 * @returns Average soil data or null
 */
export declare function getAverageSoilData(nodeId: number, hours?: number): Promise<{
    nodeId: number;
    avgSoilMoistureVWC: number;
    avgSoilTemperature: number;
    readingsCount: number;
    hours: number;
} | null>;
/**
 * Get average air measurements over time period
 *
 * @param nodeId - Sensor node ID
 * @param hours - Time window in hours (default 24)
 * @returns Average air data or null
 */
export declare function getAverageAirData(nodeId: number, hours?: number): Promise<{
    nodeId: number;
    avgAirTemperature: number;
    avgAirHumidity: number;
    avgAirPressure: number | null;
    readingsCount: number;
    hours: number;
} | null>;
//# sourceMappingURL=sensor.service.d.ts.map