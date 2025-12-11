/**
 * Irrigation Controller
 * 
 * Handles irrigation decision and recommendation API endpoints
 * Uses FAO-56 soil water balance methodology
 * 
 * UPDATED: Dec 11, 2025 - Enhanced with urgency filtering and statistics
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import {
    makeIrrigationDecision,
    getIrrigationRecommendations,
} from '../services/irrigation/irrigation.service.js';
import { getAllFields } from '../repositories/field.repository.js';
import { createLogger } from '../config/logger.js';
import { IRRIGATION_URGENCY } from '../utils/constants.js';
import type { IrrigationUrgency } from '../utils/constants.js';

const logger = createLogger({ service: 'irrigation-controller' });

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
    minUrgency: z.enum(['NONE', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL']).optional(),
    includeNone: z.coerce.boolean().optional().default(true),
});

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
export async function getIrrigationDecisionController(req: Request, res: Response): Promise<void> {
    try {
        const { nodeId } = nodeIdSchema.parse(req.params);

        logger.info({ nodeId }, 'Fetching irrigation decision');

        const decision = await makeIrrigationDecision(nodeId);

        res.json({
            success: true,
            data: decision,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error({ error, params: req.params }, 'Failed to get irrigation decision');
        throw error;
    }
}

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
export async function getIrrigationRecommendationsController(req: Request, res: Response): Promise<void> {
    try {
        const { minUrgency, includeNone } = querySchema.parse(req.query);

        logger.info({ minUrgency, includeNone }, 'Fetching irrigation recommendations for all fields');

        const fields = await getAllFields();

        // Only get recommendations for fields with confirmed crops
        const nodeIds = fields
            .filter(f => f.cropConfirmed)
            .map(f => f.nodeId);

        logger.debug({ totalFields: fields.length, confirmedCrops: nodeIds.length }, 'Fields filtered');

        if (nodeIds.length === 0) {
            res.json({
                success: true,
                data: {
                    total: 0,
                    recommendations: [],
                    summary: {
                        byUrgency: {},
                        irrigateNow: 0,
                        irrigateSoon: 0,
                        noAction: 0,
                    },
                    message: 'No fields with confirmed crops found',
                },
                timestamp: new Date().toISOString(),
            });
            return;
        }

        let recommendations = await getIrrigationRecommendations(nodeIds);

        // Apply urgency filters
        if (!includeNone) {
            recommendations = recommendations.filter(r => r.urgency !== IRRIGATION_URGENCY.NONE);
        }

        if (minUrgency) {
            const urgencyLevels: IrrigationUrgency[] = ['NONE', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
            const minIndex = urgencyLevels.indexOf(minUrgency);
            recommendations = recommendations.filter(r => {
                const currentIndex = urgencyLevels.indexOf(r.urgency);
                return currentIndex >= minIndex;
            });
        }

        // Calculate summary statistics
        const summary = {
            byUrgency: {
                CRITICAL: recommendations.filter(r => r.urgency === IRRIGATION_URGENCY.CRITICAL).length,
                HIGH: recommendations.filter(r => r.urgency === IRRIGATION_URGENCY.HIGH).length,
                MODERATE: recommendations.filter(r => r.urgency === IRRIGATION_URGENCY.MODERATE).length,
                LOW: recommendations.filter(r => r.urgency === IRRIGATION_URGENCY.LOW).length,
                NONE: recommendations.filter(r => r.urgency === IRRIGATION_URGENCY.NONE).length,
            },
            irrigateNow: recommendations.filter(r => r.decision === 'irrigate_now').length,
            irrigateSoon: recommendations.filter(r => r.decision === 'irrigate_soon').length,
            noAction: recommendations.filter(r => r.decision === 'do_not_irrigate').length,
        };

        logger.info({
            total: recommendations.length,
            critical: summary.byUrgency.CRITICAL,
            high: summary.byUrgency.HIGH,
            irrigateNow: summary.irrigateNow,
        }, 'Irrigation recommendations generated');

        res.json({
            success: true,
            data: {
                total: recommendations.length,
                totalFields: nodeIds.length,
                recommendations,
                summary,
                filters: {
                    minUrgency: minUrgency ?? null,
                    includeNone,
                },
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        logger.error({ error }, 'Failed to get irrigation recommendations');
        throw error;
    }
}
