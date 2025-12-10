/**
 * Irrigation Decision Service
 * FAO-56 inspired water balance with weather adjustment
 */
import type { IrrigationDecision } from '../../models/common.types.js';
/**
 * Make irrigation decision
 */
export declare function makeIrrigationDecision(nodeId: number): Promise<IrrigationDecision>;
/**
 * Get irrigation recommendations for multiple fields
 */
export declare function getIrrigationRecommendations(nodeIds: number[]): Promise<IrrigationDecision[]>;
//# sourceMappingURL=irrigation.service.d.ts.map