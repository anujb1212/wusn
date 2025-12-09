/**
 * Crop Controller
 */
import { z } from 'zod';
import { getCropRecommendations } from '../services/crop/crop.service.js';
const nodeIdSchema = z.object({
    nodeId: z.coerce.number().int().positive(),
});
/**
 * GET /api/crops/recommend/:nodeId
 * Get crop recommendations for field
 */
export async function getCropRecommendationsController(req, res) {
    const { nodeId } = nodeIdSchema.parse(req.params);
    const recommendation = await getCropRecommendations(nodeId);
    res.json({
        status: 'ok',
        data: recommendation,
        timestamp: new Date().toISOString(),
    });
}
//# sourceMappingURL=crop.controller.js.map