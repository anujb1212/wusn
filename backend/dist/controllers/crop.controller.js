/**
 * Crop Controller
 *
 * Handles crop recommendation API endpoints
 * Uses MCDA (Multi-Criteria Decision Analysis)
 *
 * UPDATED: Dec 13, 2025 - Added crop catalog endpoint + hardened query parsing
 */
import { z } from 'zod';
import { createLogger } from '../config/logger.js';
import { getCropCatalog, getCropRecommendations } from '../services/crop/crop.service.js';
const logger = createLogger({ service: 'crop-controller' });
const nodeIdSchema = z.object({
    nodeId: z.coerce.number().int().positive(),
});
/**
 * Normalize Express query values (string | string[] | undefined) to a single value.
 */
function firstQueryValue(v) {
    if (Array.isArray(v))
        return v[0];
    return v;
}
/**
 * Safe boolean parsing for querystrings:
 * - Accepts true/false/1/0 (case-insensitive)
 * - Rejects other values instead of coercing truthy strings like "false"
 */
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
/**
 * Number helpers: we push .int() / .min() / .max() into the inner schema,
 * not on the ZodEffects wrapper (which would cause TS errors).
 */
const limitQuery = z.preprocess((v) => firstQueryValue(v), z.coerce.number().int().min(1).max(20));
const scoreQuery = z.preprocess((v) => firstQueryValue(v), z.coerce.number().min(0).max(100));
const querySchema = z.object({
    limit: limitQuery.optional().default(20),
    suitableOnly: booleanQuery.optional().default(false),
    minScore: scoreQuery.optional(),
});
/**
 * GET /api/crops
 * Crop catalog for clients (dropdowns, validations).
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
/**
 * GET /api/crops/recommend/:nodeId
 */
export async function getCropRecommendationsController(req, res) {
    try {
        const { nodeId } = nodeIdSchema.parse(req.params);
        // Ensure strong typing instead of `unknown`
        const parsed = querySchema.parse(req.query);
        const { limit, suitableOnly, minScore } = parsed;
        logger.info({ nodeId, limit, suitableOnly, minScore }, 'Fetching crop recommendations');
        const recommendation = await getCropRecommendations(nodeId);
        // Clone to avoid mutating underlying recommendation/topCrops objects.
        let filteredCrops = recommendation.topCrops.map((c) => ({ ...c, scores: { ...c.scores } }));
        if (suitableOnly) {
            filteredCrops = filteredCrops.filter((crop) => crop.suitable);
        }
        if (typeof minScore === 'number') {
            filteredCrops = filteredCrops.filter((crop) => crop.totalScore >= minScore);
        }
        filteredCrops = filteredCrops.slice(0, limit);
        // Re-rank after filtering (safe; these are clones)
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
        throw error; // let central error middleware format the response
    }
}
//# sourceMappingURL=crop.controller.js.map