
/**
 * Sensor Routes
 */

import { Router } from 'express';
import { asyncHandler } from '../api/middleware/asyncHandler.js';
import {
    getLatestSensorData,
    getAverageSensorData,
    getSensorReadings
} from '../controllers/sensorController.js';

const router = Router();

router.get('/:nodeId/latest', asyncHandler(getLatestSensorData));
router.get('/:nodeId/average', asyncHandler(getAverageSensorData));
router.get('/:nodeId/readings', asyncHandler(getSensorReadings));

export default router;
