/**
 * Irrigation Controller
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import {
    makeIrrigationDecision,
    getIrrigationRecommendations,
} from '../services/irrigation/irrigation.service.js';
import { getAllFields } from '../repositories/field.repository.js';

const nodeIdSchema = z.object({
    nodeId: z.coerce.number().int().positive(),
});

/**
 * GET /api/irrigation/decision/:nodeId
 * Get irrigation decision for specific field
 */
export async function getIrrigationDecisionController(req: Request, res: Response): Promise<void> {
    const { nodeId } = nodeIdSchema.parse(req.params);

    const decision = await makeIrrigationDecision(nodeId);

    res.json({
        status: 'ok',
        data: decision,
        timestamp: new Date().toISOString(),
    });
}

/**
 * GET /api/irrigation/recommendations
 * Get irrigation recommendations for all fields
 */
export async function getIrrigationRecommendationsController(req: Request, res: Response): Promise<void> {
    const fields = await getAllFields();
    const nodeIds = fields
        .filter(f => f.cropConfirmed)
        .map(f => f.nodeId);

    const recommendations = await getIrrigationRecommendations(nodeIds);

    res.json({
        status: 'ok',
        data: {
            total: recommendations.length,
            recommendations,
        },
        timestamp: new Date().toISOString(),
    });
}
