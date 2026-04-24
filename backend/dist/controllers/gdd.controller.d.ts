/**
 * GDD (Growing Degree Days) Controller
 * GDD = max(0, (adjusted_Tmax + adjusted_Tmin)/2 - Tbase)
 */
import type { Request, Response } from 'express';
/**
 * GET /api/gdd/:nodeId/status
 *
 * Get current GDD status for a field
 *
 * Returns:
 * - Accumulated GDD since sowing
 * - GDD thresholds for each growth stage (initialStageGDD, developmentStageGDD, midSeasonGDD, lateSeasonGDD)
 * - Progress percentage toward maturity
 * - Current growth stage
 * - Estimated days to next stage and harvest
 *
 * @param req.params.nodeId - Sensor node ID
 * @returns GDD status and crop progress
 *
 * @example
 * GET /api/gdd/1/status
 */
export declare function getGDDStatusController(req: Request, res: Response): Promise<void>;
/**
 * POST /api/gdd/:nodeId/calculate
 *
 * Calculate GDD for a specific date
 *
 * Uses USDA Method 2:
 * 1. Adjust Tmin: if Tmin < Tbase, set Tmin = Tbase
 * 2. Adjust Tmax: if Tmax < Tbase, set Tmax = Tbase
 * 3. Calculate: GDD = max(0, (adjusted_Tmax + adjusted_Tmin)/2 - Tbase)
 *
 * Where Tbase comes from CropParameters.baseTemp
 *
 * @param req.params.nodeId - Sensor node ID
 * @param req.body.date - Date in YYYY-MM-DD format
 * @returns Daily GDD calculation result
 *
 * @example
 * POST /api/gdd/1/calculate
 */
export declare function calculateGDDController(req: Request, res: Response): Promise<void>;
/**
 * POST /api/gdd/:nodeId/recalculate
 *
 * @param req.params.nodeId - Sensor node ID
 * @param req.body.startDate - Start date (YYYY-MM-DD)
 * @param req.body.endDate - End date (YYYY-MM-DD)
 * @returns Number of days recalculated
 *
 * @example
 * POST /api/gdd/1/recalculate
 * Body: { "startDate": "2025-11-01", "endDate": "2025-12-10" }
 * Response:
 * {
 *   "nodeId": 1,
 *   "recalculated": 40,
 *   "startDate": "2025-11-01",
 *   "endDate": "2025-12-10"
 * }
 */
export declare function recalculateGDDController(req: Request, res: Response): Promise<void>;
/**
 * POST /api/gdd/:nodeId/calculate-missing
 *
 * Calculate missing GDD records since sowing date
 *
 * Automatically identifies gaps in GDD history and fills them.
 * Should be run:
 * - Daily (as scheduled job to calculate yesterday's GDD)
 * - After crop confirmation
 * - After system downtime
 * - After schema migration
 *
 * @param req.params.nodeId - Sensor node ID
 * @returns Number of missing records calculated
 *
 * @example
 * POST /api/gdd/1/calculate-missing
 */
export declare function calculateMissingGDDController(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=gdd.controller.d.ts.map