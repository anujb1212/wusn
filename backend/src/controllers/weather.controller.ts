// src/controllers/weather.controller.ts
/**
 * Weather Controller
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { getWeatherForecast } from '../services/weather/weather.sevice.js';
import { getFieldByNodeId } from '../repositories/field.repository.js';
import { ValidationError } from '../utils/errors.js';

const nodeIdSchema = z.object({
    nodeId: z.coerce.number().int().positive(),
});

/**
 * GET /api/weather/:nodeId/forecast
 * Get weather forecast for field
 */
export async function getWeatherForecastController(req: Request, res: Response): Promise<void> {
    const { nodeId } = nodeIdSchema.parse(req.params);

    const field = await getFieldByNodeId(nodeId);

    if (!field.latitude || !field.longitude) {
        throw new ValidationError('Field does not have coordinates configured');
    }

    const forecast = await getWeatherForecast(field.latitude, field.longitude);

    res.json({
        status: 'ok',
        data: {
            nodeId,
            fieldName: field.fieldName,
            location: {
                latitude: field.latitude,
                longitude: field.longitude,
            },
            forecast: forecast.forecast,
            fetchedAt: forecast.fetchedAt,
            expiresAt: forecast.expiresAt,
        },
        timestamp: new Date().toISOString(),
    });
}
