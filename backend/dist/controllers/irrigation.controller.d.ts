import type { Request, Response } from 'express';
export declare function getIrrigationDecisionController(req: Request, res: Response): Promise<void>;
/**
 * GET /api/irrigation/recommendations
 *
 * Get irrigation recommendations for all fields with confirmed crops
 *
 * Returns fields sorted by urgency (most critical first)
 * Useful for dashboard view and irrigation scheduling
 *
 * Query parameters:
 * @param minUrgency - Filter to show only fields at or above this urgency level
 * @param includeNone - Include fields with urgency NONE (default: true)
 *
 * @returns Array of irrigation decisions sorted by urgency score
 *
 * @example
 * GET /api/irrigation/recommendations?minUrgency=MODERATE&includeNone=false
 * Returns only fields that need irrigation soon or now
 */
export declare function getIrrigationRecommendationsController(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=irrigation.controller.d.ts.map