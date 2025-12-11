/**
 * Irrigation Decision Service
 *
 * FAO-56 compliant soil water balance and irrigation scheduling
 *
 * Key formulas:
 * - TAW = (θFC - θWP) × Zr × 1000  [mm]
 * - RAW = p × TAW  [mm]
 * - Dr = Dr,i-1 - (P - RO) - I + ETc + DP  [mm]
 * - Ks = (TAW - Dr) / (TAW - RAW)  [stress coefficient]
 * - ETc = Kc × ET0  [mm/day]
 *
 * References:
 * - FAO Irrigation and Drainage Paper 56 (Allen et al., 1998)
 * - Chapter 8: ETc under soil water stress conditions
 * - Hargreaves equation for ET0 estimation
 *
 * Data sources:
 * - Current VWC from SensorReading.soilMoistureVWC
 * - Air temperature from SensorReading.airTemperature (for ET estimation)
 * - Weather forecast for rain adjustment
 * - Crop parameters from CROP_DATABASE (MAD, Kc, root depth)
 *
 * UPDATED: Dec 11, 2025 - Enhanced to use Kc values from new schema
 */
import type { IrrigationDecision } from '../../models/common.types.js';
/**
 * Make irrigation decision for a field
 *
 * Process:
 * 1. Validate field has confirmed crop
 * 2. Get latest sensor reading (VWC)
 * 3. Calculate soil water balance
 * 4. Determine base urgency
 * 5. Check weather forecast and adjust urgency
 * 6. Calculate irrigation depth and duration
 * 7. Generate decision and reason
 *
 * @param nodeId - Sensor node ID
 * @returns IrrigationDecision with recommendation and parameters
 */
export declare function makeIrrigationDecision(nodeId: number): Promise<IrrigationDecision>;
/**
 * Get irrigation recommendations for multiple fields
 *
 * Useful for dashboard views or batch irrigation scheduling
 *
 * @param nodeIds - Array of sensor node IDs
 * @returns Array of irrigation decisions sorted by urgency (highest first)
 */
export declare function getIrrigationRecommendations(nodeIds: number[]): Promise<IrrigationDecision[]>;
//# sourceMappingURL=irrigation.service.d.ts.map