// src/routes/nodeRoutes.ts
import { Router } from 'express';
import { asyncHandler } from '../api/middleware/asyncHandler.js';
import { createNodeController, getNodesController, getNodeController, } from '../controllers/nodeController.js';
const router = Router();
router.post('/', asyncHandler(createNodeController));
router.get('/', asyncHandler(getNodesController));
router.get('/:nodeId', asyncHandler(getNodeController));
export default router;
//# sourceMappingURL=nodeRoutes.js.map