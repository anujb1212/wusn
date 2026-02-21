/**
 * Crop Controller
 *
 * Handles crop recommendation API endpoints
 * Uses MCDA (Multi-Criteria Decision Analysis)
 *
 * UPDATED: Dec 13, 2025 - Added crop catalog endpoint + hardened query parsing
 */
import type { Request, Response } from 'express';
/**
 * GET /api/crops
 * Crop catalog for clients (dropdowns, validations).
 * Canonical crop IDs must match recommendation IDs.
 */
export declare function getCropCatalogController(_req: Request, res: Response): Promise<void>;
/**
 * GET /api/crops/recommend/:nodeId
 */
export declare function getCropRecommendationsController(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=crop.controller.d.ts.map