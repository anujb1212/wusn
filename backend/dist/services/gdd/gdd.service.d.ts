/**
 * GDD (Growing Degree Days) Service
 *
 * Calculates daily and cumulative GDD from AIR temperature readings (not soil temperature)
 *
 * Standard GDD Formula (Method 2 - recommended by USDA):
 *   Daily GDD = max(0, (Tmax + Tmin)/2 - Tbase)
 *   Where: If Tmin < Tbase, set Tmin = Tbase
 *          If Tmax < Tbase, set Tmax = Tbase
 *          If Tmax > Tupper (optional ceiling), set Tmax = Tupper
 *
 * This method prevents negative contributions and properly handles cold days.
 *
 * References:
 * - McMaster & Wilhelm (1997): "Growing degree-days: one equation, two interpretations"
 * - Michigan State University: Calculating Growing Degree Days
 * - FAO crop growth modeling standards
 *
 * All calculations use AIR temperature from SensorReading.airTemperature, NOT soil temperature.
 *
 * UPDATED: Dec 11, 2025 - Aligned with new Prisma CropParameters schema
 * Changes: stages.initial/development/midSeason/lateSeason → initialStageGDD/developmentStageGDD/midSeasonGDD/lateSeasonGDD
 */
import type { GDDResult, GDDStatus } from '../../models/common.types.js';
/**
 * Calculate GDD for a specific day and update field
 *
 * Process:
 * 1. Validate field has confirmed crop and sowing date
 * 2. Check date is not before sowing
 * 3. Get daily min/max air temperatures from gateway readings
 * 4. Calculate daily GDD using USDA Method 2
 * 5. Add to cumulative GDD
 * 6. Determine growth stage
 * 7. Save GDD record and update field
 *
 * @param nodeId - Sensor node ID
 * @param date - Date to calculate GDD for
 * @returns GDDResult or null if cannot calculate
 */
export declare function calculateDailyGDD(nodeId: number, date: Date): Promise<GDDResult | null>;
/**
 * Get current GDD status for a field
 *
 * Returns comprehensive GDD tracking information including:
 * - Cumulative GDD accumulated
 * - Progress percentage toward maturity
 * - Current growth stage
 * - Days from sowing
 * - Estimated days to harvest
 *
 * FIXED: Now calculates expectedGDDTotal from cropParams.lateSeasonGDD
 *
 * @param nodeId - Sensor node ID
 * @returns GDDStatus
 * @throws ValidationError if field doesn't have confirmed crop
 */
export declare function getGDDStatus(nodeId: number): Promise<GDDStatus>;
/**
 * Recalculate GDD for a date range (batch processing)
 *
 * Useful for:
 * - Correcting historical data after sensor calibration
 * - Backfilling missing GDD records
 * - Recalculating after base temperature change
 *
 * WARNING: Deletes existing records in range before recalculating
 *
 * @param nodeId - Sensor node ID
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns Number of days successfully calculated
 */
export declare function recalculateGDDRange(nodeId: number, startDate: Date, endDate: Date): Promise<number>;
/**
 * Calculate missing GDD records since sowing date
 *
 * Identifies gaps in GDD record history and fills them.
 * Useful for:
 * - Catching up after system downtime
 * - Initial GDD calculation for newly confirmed crops
 * - Daily scheduled job to calculate yesterday's GDD
 *
 * @param nodeId - Sensor node ID
 * @returns Number of missing records successfully calculated
 */
export declare function calculateMissingGDD(nodeId: number): Promise<number>;
//# sourceMappingURL=gdd.service.d.ts.map