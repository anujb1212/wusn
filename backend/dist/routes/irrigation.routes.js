/**
 * Irrigation Routes
 */
import { Router } from 'express';
import { asyncHandler } from '../api/middleware/asyncHandler.js';
import { getIrrigationDecisionController, getIrrigationRecommendationsController, } from '../controllers/irrigation.controller.js';
const router = Router();
router.get('/decision/:nodeId', asyncHandler(getIrrigationDecisionController));
router.get('/recommendations', asyncHandler(getIrrigationRecommendationsController));
export default router;
//# sourceMappingURL=irrigation.routes.js.map