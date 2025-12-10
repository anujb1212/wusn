/**
 * Crop Routes
 */
import { Router } from 'express';
import { asyncHandler } from '../api/middleware/asyncHandler.js';
import { getCropRecommendationsController } from '../controllers/crop.controller.js';
const router = Router();
router.get('/recommend/:nodeId', asyncHandler(getCropRecommendationsController));
export default router;
//# sourceMappingURL=crop.routes.js.map