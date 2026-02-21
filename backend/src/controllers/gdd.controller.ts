/**
 * GDD (Growing Degree Days) Controller
 * 
 * Handles GDD calculation and tracking API endpoints
 * Uses USDA Method 2 for daily GDD calculation
 * 
 * Method 2: If Tmax or Tmin < Tbase, they are reset to Tbase
 * GDD = max(0, (adjusted_Tmax + adjusted_Tmin)/2 - Tbase)
 * 
 * UPDATED: Dec 11, 2025 - Aligned with new schema (stage-based GDD thresholds)
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import {
    getGDDStatus,
    calculateDailyGDD,
    recalculateGDDRange,
    calculateMissingGDD,
} from '../services/gdd/gdd.service.js';
import { createLogger } from '../config/logger.js';

const logger = createLogger({ service: 'gdd-controller' });

/**
 * Validation schemas
 */
const nodeIdSchema = z.object({
    nodeId: z.coerce.number().int().positive(),
});

const dateSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

const dateRangeSchema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
});

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
 * Response:
 * {
 *   "accumulatedGDD": 850,
 *   "currentStage": "DEVELOPMENT",
 *   "nextStage": "MID_SEASON",
 *   "progressPercent": 40.5,
 *   "daysToHarvest": 65
 * }
 */
export async function getGDDStatusController(req: Request, res: Response): Promise<void> {
    try {
        const { nodeId } = nodeIdSchema.parse(req.params);

        logger.info({ nodeId }, 'Fetching GDD status');

        const status = await getGDDStatus(nodeId);

        res.json({
            success: true,
            data: status,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error({ error, params: req.params }, 'Failed to get GDD status');
        throw error;
    }
}

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
 * Body: { "date": "2025-12-10" }
 * Response:
 * {
 *   "date": "2025-12-10",
 *   "dailyGDD": 15.5,
 *   "tmin": 18.2,
 *   "tmax": 31.8,
 *   "baseTemp": 10
 * }
 */
export async function calculateGDDController(req: Request, res: Response): Promise<void> {
    try {
        const { nodeId } = nodeIdSchema.parse(req.params);
        const { date } = dateSchema.parse(req.body);

        logger.info({ nodeId, date }, 'Calculating GDD for specific date');

        const result = await calculateDailyGDD(nodeId, new Date(date));

        if (!result) {
            res.json({
                success: false,
                message: 'Could not calculate GDD (date before sowing or no temperature data)',
                data: null,
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error({ error, params: req.params, body: req.body }, 'Failed to calculate GDD');
        throw error;
    }
}

/**
 * POST /api/gdd/:nodeId/recalculate
 * 
 * Recalculate GDD for a date range
 * 
 * Useful for:
 * - Correcting historical data after sensor calibration
 * - Backfilling after crop confirmation or base temperature change
 * - Data correction after errors
 * - Updating after schema migration (e.g., totalGDD → stage-based thresholds)
 * 
 * WARNING: Deletes existing records in range before recalculating
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
export async function recalculateGDDController(req: Request, res: Response): Promise<void> {
    try {
        const { nodeId } = nodeIdSchema.parse(req.params);
        const { startDate, endDate } = dateRangeSchema.parse(req.body);

        logger.info({ nodeId, startDate, endDate }, 'Recalculating GDD for date range');

        const count = await recalculateGDDRange(
            nodeId,
            new Date(startDate),
            new Date(endDate)
        );

        logger.info({ nodeId, count }, 'GDD recalculation completed');

        res.json({
            success: true,
            data: {
                nodeId,
                recalculated: count,
                startDate,
                endDate,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error({ error, params: req.params, body: req.body }, 'Failed to recalculate GDD range');
        throw error;
    }
}

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
 * Response:
 * {
 *   "nodeId": 1,
 *   "calculated": 3,
 *   "message": "Successfully calculated 3 missing GDD record(s)"
 * }
 */
export async function calculateMissingGDDController(req: Request, res: Response): Promise<void> {
    try {
        const { nodeId } = nodeIdSchema.parse(req.params);

        logger.info({ nodeId }, 'Calculating missing GDD records');

        const count = await calculateMissingGDD(nodeId);

        logger.info({ nodeId, count }, 'Missing GDD calculation completed');

        res.json({
            success: true,
            data: {
                nodeId,
                calculated: count,
                message: count === 0
                    ? 'No missing GDD records found'
                    : `Successfully calculated ${count} missing GDD record(s)`,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error({ error, params: req.params }, 'Failed to calculate missing GDD');
        throw error;
    }
}
