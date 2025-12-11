// src/controllers/sensorController.ts
/**
 * Sensor Controller
 */

import type { Request, Response } from 'express';
import * as sensorService from '../services/sensor/sensor.service.js';
import * as sensorRepo from '../repositories/sensor.repository.js';
import { ValidationError } from '../utils/errors.js';

/**
 * Get latest sensor data for a node
 * GET /api/sensors/:nodeId/latest
 */
export async function getLatestSensorData(req: Request, res: Response): Promise<void> {
    const nodeIdParam = req.params.nodeId;

    if (!nodeIdParam) {
        throw new ValidationError('nodeId parameter is required');
    }

    const nodeId = parseInt(nodeIdParam, 10);

    if (isNaN(nodeId) || nodeId <= 0) {
        throw new ValidationError('Invalid nodeId');
    }

    const data = await sensorService.getLatestSensorData(nodeId);

    res.json({
        status: 'ok',
        data,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Get average sensor data for last N hours
 * GET /api/sensors/:nodeId/average?hours=24
 */
export async function getAverageSensorData(req: Request, res: Response): Promise<void> {
    const nodeIdParam = req.params.nodeId;

    if (!nodeIdParam) {
        throw new ValidationError('nodeId parameter is required');
    }

    const nodeId = parseInt(nodeIdParam, 10);
    const hoursParam = req.query.hours;
    const hours = typeof hoursParam === 'string' ? parseInt(hoursParam, 10) : 24;

    if (isNaN(nodeId) || nodeId <= 0) {
        throw new ValidationError('Invalid nodeId');
    }

    if (isNaN(hours) || hours <= 0 || hours > 168) {
        throw new ValidationError('Hours must be between 1 and 168');
    }

    const data = await sensorService.getAverageSoilData(nodeId, hours);

    res.json({
        status: 'ok',
        data,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Get sensor readings with filters
 * GET /api/sensors/:nodeId/readings?startDate=2025-01-01&endDate=2025-01-07&limit=100
 */
export async function getSensorReadings(req: Request, res: Response): Promise<void> {
    const nodeIdParam = req.params.nodeId;

    if (!nodeIdParam) {
        throw new ValidationError('nodeId parameter is required');
    }

    const nodeId = parseInt(nodeIdParam, 10);

    if (isNaN(nodeId) || nodeId <= 0) {
        throw new ValidationError('Invalid nodeId');
    }

    const startDateParam = req.query.startDate;
    const endDateParam = req.query.endDate;
    const limitParam = req.query.limit;

    // Build filters object conditionally
    const filters: sensorRepo.SensorReadingFilters = { nodeId };

    if (typeof startDateParam === 'string') {
        filters.startDate = new Date(startDateParam);
    }

    if (typeof endDateParam === 'string') {
        filters.endDate = new Date(endDateParam);
    }

    if (typeof limitParam === 'string') {
        const parsedLimit = parseInt(limitParam, 10);
        if (!isNaN(parsedLimit) && parsedLimit > 0) {
            filters.limit = parsedLimit;
        }
    }

    const readings = await sensorRepo.getReadings(filters);

    res.json({
        status: 'ok',
        data: readings,
        timestamp: new Date().toISOString(),
    });
}
