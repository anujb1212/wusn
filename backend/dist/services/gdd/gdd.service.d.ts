/**
 * GDD (Growing Degree Days) Service
 * Calculates daily and cumulative GDD from air temperature readings
 * Formula: GDD = max(0, avgAirTemp - baseTemp)
 */
import type { GDDResult, GDDStatus } from '../../models/common.types.js';
/**
 * Calculate GDD for a specific day
 */
export declare function calculateDailyGDD(nodeId: number, date: Date): Promise<GDDResult | null>;
/**
 * Get current GDD status for field
 */
export declare function getGDDStatus(nodeId: number): Promise<GDDStatus>;
/**
 * Recalculate GDD for date range (batch processing)
 */
export declare function recalculateGDDRange(nodeId: number, startDate: Date, endDate: Date): Promise<number>;
/**
 * Calculate missing GDD records since sowing
 */
export declare function calculateMissingGDD(nodeId: number): Promise<number>;
//# sourceMappingURL=gdd.service.d.ts.map