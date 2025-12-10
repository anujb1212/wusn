/**
 * GDD Routes
 */
import { Router } from 'express';
import { asyncHandler } from '../api/middleware/asyncHandler.js';
import { getGDDStatusController, calculateGDDController, recalculateGDDController, calculateMissingGDDController, } from '../controllers/gdd.controller.js';
const router = Router();
router.get('/:nodeId/status', asyncHandler(getGDDStatusController));
router.post('/:nodeId/calculate', asyncHandler(calculateGDDController));
router.post('/:nodeId/recalculate', asyncHandler(recalculateGDDController));
router.post('/:nodeId/calculate-missing', asyncHandler(calculateMissingGDDController));
export default router;
//# sourceMappingURL=gdd.routes.js.map