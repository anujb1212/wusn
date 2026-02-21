/**
 * Crop Routes
 */
import { Router } from 'express';
import { asyncHandler } from '../api/middleware/asyncHandler.js';
import {
    getCropCatalogController,
    getCropRecommendationsController,
} from '../controllers/crop.controller.js';

const router = Router();

// Catalog endpoint for mobile dropdown (canonical crop universe)
router.get('/', asyncHandler(getCropCatalogController));
router.get('/catalog', asyncHandler(getCropCatalogController));

// Recommendations
router.get('/recommend/:nodeId', asyncHandler(getCropRecommendationsController));

export default router;
