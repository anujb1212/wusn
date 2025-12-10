import type { SensorPayload, ProcessedSensorData } from '../../models/common.types.js';
/**
 * Process incoming sensor data
 */
export declare function processSensorData(payload: SensorPayload): Promise<ProcessedSensorData>;
/**
 * Get latest sensor data for a node
 */
export declare function getLatestSensorData(nodeId: number): Promise<{
    nodeId: number;
    soilMoistureVWC: number;
    soilTemperature: number;
    timestamp: Date;
} | null>;
/**
 * Get average sensor data for a node over time period
 */
export declare function getAverageSensorData(nodeId: number, hours?: number): Promise<{
    nodeId: number;
    avgSoilMoistureVWC: number;
    avgSoilTemperature: number;
    readingsCount: number;
    hours: number;
} | null>;
//# sourceMappingURL=sensor.service.d.ts.map