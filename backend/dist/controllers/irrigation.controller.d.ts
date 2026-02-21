/**
 * Irrigation Controller
 *
 * Handles irrigation decision and recommendation API endpoints
 * Uses FAO-56 soil water balance methodology
 *
 * UPDATED: Dec 11, 2025 - Enhanced with urgency filtering and statistics
 */
import type { Request, Response } from 'express';
/**
 * GET /api/irrigation/decision/:nodeId
 *
 * Get irrigation decision for a specific field
 *
 * Uses FAO-56 methodology with:
 * - Soil water balance (TAW, RAW, depletion)
 * - Crop-specific MAD thresholds
 * - Weather forecast adjustment
 * - VWC-based urgency levels
 *
 * @param req.params.nodeId - Sensor node ID
 * @returns Irrigation decision with urgency, depth, and duration
 *
 * @example
 * GET /api/irrigation/decision/1
 * Response:
 * {
 *   "decision": "irrigate_now",
 *   "urgency": "HIGH",
 *   "urgencyScore": 75,
 *   "currentVWC": 18.5,
 *   "targetVWC": 28.0,
 *   "suggestedDepthMm": 25.5,
 *   "suggestedDurationMin": 306
 * }
 */
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