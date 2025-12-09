/**
 * Sensor Controller
 */
import type { Request, Response } from 'express';
/**
 * Get latest sensor data for a node
 * GET /api/sensors/:nodeId/latest
 */
export declare function getLatestSensorData(req: Request, res: Response): Promise<void>;
/**
 * Get average sensor data for last N hours
 * GET /api/sensors/:nodeId/average?hours=24
 */
export declare function getAverageSensorData(req: Request, res: Response): Promise<void>;
/**
 * Get sensor readings with filters
 * GET /api/sensors/:nodeId/readings?startDate=2025-01-01&endDate=2025-01-07&limit=100
 */
export declare function getSensorReadings(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=sensorController.d.ts.map