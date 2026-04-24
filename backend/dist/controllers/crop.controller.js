/*
 * Crop Controller
 *
 * Handles crop recommendation API endpoints
 * Uses MCDA (Multi-Criteria Decision Analysis)
 */
import { z } from 'zod';
import { createLogger } from '../config/logger.js';
import { getCropCatalog, getCropRecommendations } from '../services/crop/crop.service.js';
const logger = createLogger({ service: 'crop-controller' });
const nodeIdSchema = z.object({
    nodeId: z.coerce.number().int().positive(),
});
function firstQueryValue(v) {
    if (Array.isArray(v))
        return v[0];
    return v;
}
const booleanQuery = z.preprocess((v) => {
    const value = firstQueryValue(v);
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'string') {
        const s = value.trim().toLowerCase();
        if (s === 'true')
            return true;
        if (s === 'false')
            return false;
        if (s === '1')
            return true;
        if (s === '0')
            return false;
    }
    return value;
}, z.boolean());
const limitQuery = z.preprocess((v) => firstQueryValue(v), z.coerce.number().int().min(1).max(20));
const scoreQuery = z.preprocess((v) => firstQueryValue(v), z.coerce.number().min(0).max(100));
const querySchema = z.object({
    limit: limitQuery.optional().default(20),
    suitableOnly: booleanQuery.optional().default(false),
    minScore: scoreQuery.optional(),
});
/*
 * GET /api/crops
 * Crop catalog for clients
 * Canonical crop IDs must match recommendation IDs.
 */
export async function getCropCatalogController(_req, res) {
    const catalog = await getCropCatalog();
    res.json({
        success: true,
        data: catalog,
        timestamp: new Date().toISOString(),
    });
}
// GET /api/crops/recommend/:nodeId
export async function getCropRecommendationsController(req, res) {
    try {
        const { nodeId } = nodeIdSchema.parse(req.params);
        const parsed = querySchema.parse(req.query);
        const { limit, suitableOnly, minScore } = parsed;
        logger.info({ nodeId, limit, suitableOnly, minScore }, 'Fetching crop recommendations');
        const recommendation = await getCropRecommendations(nodeId);
        let filteredCrops = recommendation.topCrops.map((c) => ({ ...c, scores: { ...c.scores } }));
        if (suitableOnly) {
            filteredCrops = filteredCrops.filter((crop) => crop.suitable);
        }
        if (typeof minScore === 'number') {
            filteredCrops = filteredCrops.filter((crop) => crop.totalScore >= minScore);
        }
        filteredCrops = filteredCrops.slice(0, limit);
        filteredCrops = filteredCrops.map((crop, index) => ({
            ...crop,
            rank: index + 1,
        }));
        res.json({
            success: true,
            data: {
                nodeId: recommendation.nodeId,
                fieldName: recommendation.fieldName,
                currentSeason: recommendation.currentSeason,
                recommendedCrop: recommendation.recommendedCrop,
                topCrops: filteredCrops,
                conditions: recommendation.conditions,
                metadata: {
                    totalCropsEvaluated: recommendation.topCrops.length,
                    cropsReturned: filteredCrops.length,
                    suitableCropsCount: recommendation.topCrops.filter((c) => c.suitable).length,
                    filtersApplied: {
                        limit,
                        suitableOnly,
                        minScore: typeof minScore === 'number' ? minScore : null,
                    },
                },
                timestamp: recommendation.timestamp,
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        logger.error({ error, params: req.params, query: req.query }, 'Failed to get crop recommendations');
        throw error;
    }
}
//# sourceMappingURL=crop.controller.js.map