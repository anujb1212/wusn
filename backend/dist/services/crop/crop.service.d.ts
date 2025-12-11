/**
 * Crop Recommendation Service
 *
 * Multi-Criteria Decision Analysis (MCDA) for crop suitability
 * Uses 20-crop universe only, with research-backed scoring weights
 *
 * Data sources:
 * - Gateway: soilMoisture (VWC), soilTemperature, airTemperature, airHumidity
 * - Field: soilTexture, accumulatedGDD
 * - External: current season (date-based for UP)
 *
 * Scoring criteria (total 100 points):
 * - Moisture suitability: 30 points (most critical for immediate growth)
 * - Air temperature suitability: 25 points (optimal temp range)
 * - Season match: 20 points (Rabi/Kharif/Zaid/Perennial)
 * - Soil texture: 15 points (preferred soil types)
 * - GDD feasibility: 10 points (can complete cycle in remaining season)
 *
 * References:
 * - Multi-Criteria Decision Making for crop selection (MCDM methodology)
 * - FAO crop suitability assessment guidelines
 * - ICAR recommendations for UP crops
 *
 * UPDATED: Dec 11, 2025 - Aligned with new Prisma CropParameters schema
 */
import type { CropRecommendation } from '../../models/common.types.js';
/**
 * Generate crop recommendations for a field
 *
 * Process:
 * 1. Fetch field configuration and latest sensor reading
 * 2. Extract current conditions (VWC, soil temp, soil texture, season)
 * 3. Score all 20 crops using MCDA methodology
 * 4. Rank crops by total score
 * 5. Return top recommendation and full ranking
 *
 * @param nodeId - Sensor node ID
 * @returns CropRecommendation with ranked list of all 20 crops
 * @throws NotFoundError if field or sensor data not found
 *
 * FIXED: Now uses soilTemperature instead of airTemperature for scoring
 */
export declare function getCropRecommendations(nodeId: number): Promise<CropRecommendation>;
//# sourceMappingURL=crop.service.d.ts.map