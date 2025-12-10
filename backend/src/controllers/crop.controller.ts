/**
 * Crop Controller
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import { getCropRecommendations } from '../services/crop/crop.service.js';

const nodeIdSchema = z.object({
    nodeId: z.coerce.number().int().positive(),
});

/**
 * GET /api/crops/recommend/:nodeId
 * Get crop recommendations for field
 */
export async function getCropRecommendationsController(req: Request, res: Response): Promise<void> {
    const { nodeId } = nodeIdSchema.parse(req.params);

    const recommendation = await getCropRecommendations(nodeId);

    res.json({
        status: 'ok',
        data: recommendation,
        timestamp: new Date().toISOString(),
    });
}
