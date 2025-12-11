/**
 * Crop Controller
 *
 * Handles crop recommendation API endpoints
 * Uses MCDA (Multi-Criteria Decision Analysis) for 20-crop universe
 *
 * UPDATED: Dec 11, 2025 - Enhanced with filtering options
 */
import type { Request, Response } from 'express';
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
export declare function getCropRecommendationsController(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=crop.controller.d.ts.map