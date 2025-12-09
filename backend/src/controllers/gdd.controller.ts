/**
 * GDD Controller
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import {
    getGDDStatus,
    calculateDailyGDD,
    recalculateGDDRange,
    calculateMissingGDD,
} from '../services/gdd/gdd.service.js';

const nodeIdSchema = z.object({
    nodeId: z.coerce.number().int().positive(),
});

const dateSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const dateRangeSchema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * GET /api/gdd/:nodeId/status
 * Get current GDD status for field
 */
export async function getGDDStatusController(req: Request, res: Response): Promise<void> {
    const { nodeId } = nodeIdSchema.parse(req.params);

    const status = await getGDDStatus(nodeId);

    res.json({
        status: 'ok',
        data: status,
        timestamp: new Date().toISOString(),
    });
}

/**
 * POST /api/gdd/:nodeId/calculate
 * Calculate GDD for specific date
 */
export async function calculateGDDController(req: Request, res: Response): Promise<void> {
    const { nodeId } = nodeIdSchema.parse(req.params);
    const { date } = dateSchema.parse(req.body);

    const result = await calculateDailyGDD(nodeId, new Date(date));

    res.json({
        status: 'ok',
        data: result,
        timestamp: new Date().toISOString(),
    });
}

/**
 * POST /api/gdd/:nodeId/recalculate
 * Recalculate GDD for date range
 */
export async function recalculateGDDController(req: Request, res: Response): Promise<void> {
    const { nodeId } = nodeIdSchema.parse(req.params);
    const { startDate, endDate } = dateRangeSchema.parse(req.body);

    const count = await recalculateGDDRange(
        nodeId,
        new Date(startDate),
        new Date(endDate)
    );

    res.json({
        status: 'ok',
        data: {
            nodeId,
            recalculated: count,
            startDate,
            endDate,
        },
        timestamp: new Date().toISOString(),
    });
}

/**
 * POST /api/gdd/:nodeId/calculate-missing
 * Calculate missing GDD records since sowing
 */
export async function calculateMissingGDDController(req: Request, res: Response): Promise<void> {
    const { nodeId } = nodeIdSchema.parse(req.params);

    const count = await calculateMissingGDD(nodeId);

    res.json({
        status: 'ok',
        data: {
            nodeId,
            calculated: count,
        },
        timestamp: new Date().toISOString(),
    });
}
