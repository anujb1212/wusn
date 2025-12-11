/**
 * Crop Controller
 *
 * Handles crop recommendation API endpoints
 * Uses MCDA (Multi-Criteria Decision Analysis) for 20-crop universe
 *
 * UPDATED: Dec 11, 2025 - Enhanced with filtering options
 */
import { z } from 'zod';
import { getCropRecommendations } from '../services/crop/crop.service.js';
import { createLogger } from '../config/logger.js';
const logger = createLogger({ service: 'crop-controller' });
/**
 * Validation schema for nodeId parameter
 */
const nodeIdSchema = z.object({
    nodeId: z.coerce.number().int().positive(),
});
/**
 * Validation schema for query parameters
 */
const querySchema = z.object({
    limit: z.coerce.number().int().min(1).max(20).optional().default(20),
    suitableOnly: z.coerce.boolean().optional().default(false),
    minScore: z.coerce.number().min(0).max(100).optional(),
});
/**
 * GET /api/crops/recommend/:nodeId
 *
 * Get crop recommendations for a field based on current conditions
 *
 * Uses MCDA algorithm with criteria:
 * - Soil moisture compatibility (30 points)
 * - Temperature suitability (25 points)
 * - Season alignment (20 points)
 * - Soil texture (15 points)
 * - GDD feasibility (10 points)
 *
 * Query parameters:
 * @param limit - Number of crops to return (1-20, default: 20)
 * @param suitableOnly - Return only crops with score >= 60 (default: false)
 * @param minScore - Minimum score threshold (0-100)
 *
 * @param req.params.nodeId - Sensor node ID
 * @returns Ranked crop recommendations with scores and explanations
 *
 * @example
 * GET /api/crops/recommend/1?limit=5&suitableOnly=true
 */
export async function getCropRecommendationsController(req, res) {
    try {
        const { nodeId } = nodeIdSchema.parse(req.params);
        const { limit, suitableOnly, minScore } = querySchema.parse(req.query);
        logger.info({ nodeId, limit, suitableOnly, minScore }, 'Fetching crop recommendations');
        const recommendation = await getCropRecommendations(nodeId);
        // Apply filters to topCrops array
        let filteredCrops = recommendation.topCrops;
        if (suitableOnly) {
            filteredCrops = filteredCrops.filter(crop => crop.suitable);
        }
        if (minScore !== undefined) {
            filteredCrops = filteredCrops.filter(crop => crop.totalScore >= minScore);
        }
        // Apply limit
        filteredCrops = filteredCrops.slice(0, limit);
        // Re-rank after filtering
        filteredCrops.forEach((crop, index) => {
            crop.rank = index + 1;
        });
        const response = {
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
                    suitableCropsCount: recommendation.topCrops.filter(c => c.suitable).length,
                    filtersApplied: {
                        limit,
                        suitableOnly,
                        minScore: minScore ?? null,
                    },
                },
                timestamp: recommendation.timestamp,
            },
            timestamp: new Date().toISOString(),
        };
        logger.info({
            nodeId,
            recommendedCrop: recommendation.recommendedCrop,
            cropsReturned: filteredCrops.length,
            topScore: filteredCrops[0]?.totalScore ?? 0,
        }, 'Crop recommendations returned successfully');
        res.json(response);
    }
    catch (error) {
        logger.error({ error, params: req.params, query: req.query }, 'Failed to get crop recommendations');
        throw error; // Let error middleware handle it
    }
}
//# sourceMappingURL=crop.controller.js.map