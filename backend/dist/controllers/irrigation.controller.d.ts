/**
 * Irrigation Controller
 */
import type { Request, Response } from 'express';
/**
 * GET /api/irrigation/decision/:nodeId
 * Get irrigation decision for specific field
 */
export declare function getIrrigationDecisionController(req: Request, res: Response): Promise<void>;
/**
 * GET /api/irrigation/recommendations
 * Get irrigation recommendations for all fields
 */
export declare function getIrrigationRecommendationsController(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=irrigation.controller.d.ts.map