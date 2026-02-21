/**
 * Crop Recommendation Service
 *
 * Alignment changes:
 * - Crop catalog uses Prisma CropParameters table (seeded)
 * - Recommendations score DB crops (validForUP=true)
 * - Type-guard keeps compatibility with existing CropName literal union types
 */
import type { CropRecommendation } from '../../models/common.types.js';
import type { Season as DbSeason } from '@prisma/client';
export type CropCatalogItem = {
    value: string;
    labelEn: string;
    season: DbSeason;
};
export declare function getCropCatalog(): Promise<CropCatalogItem[]>;
export declare function getCropRecommendations(nodeId: number): Promise<CropRecommendation>;
//# sourceMappingURL=crop.service.d.ts.map