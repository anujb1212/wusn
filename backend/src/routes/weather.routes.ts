/**
 * Weather Routes
 */

import { Router } from 'express';
import { asyncHandler } from '../api/middleware/asyncHandler.js';
import { getWeatherForecastController } from '../controllers/weather.controller.js';

const router = Router();

router.get('/:nodeId/forecast', asyncHandler(getWeatherForecastController));

export default router;
