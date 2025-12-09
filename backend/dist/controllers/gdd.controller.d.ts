/**
 * GDD Controller
 */
import type { Request, Response } from 'express';
/**
 * GET /api/gdd/:nodeId/status
 * Get current GDD status for field
 */
export declare function getGDDStatusController(req: Request, res: Response): Promise<void>;
/**
 * POST /api/gdd/:nodeId/calculate
 * Calculate GDD for specific date
 */
export declare function calculateGDDController(req: Request, res: Response): Promise<void>;
/**
 * POST /api/gdd/:nodeId/recalculate
 * Recalculate GDD for date range
 */
export declare function recalculateGDDController(req: Request, res: Response): Promise<void>;
/**
 * POST /api/gdd/:nodeId/calculate-missing
 * Calculate missing GDD records since sowing
 */
export declare function calculateMissingGDDController(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=gdd.controller.d.ts.map