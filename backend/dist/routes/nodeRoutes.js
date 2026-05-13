import { Router } from 'express';
import { asyncHandler } from '../api/middleware/asyncHandler.js';
import { createNodeController, getNodesController, getNodeController, deleteNodeController, } from '../controllers/nodeController.js';
const router = Router();
router.post('/', asyncHandler(createNodeController));
router.get('/', asyncHandler(getNodesController));
router.get('/:nodeId', asyncHandler(getNodeController));
router.delete('/:nodeId', asyncHandler(deleteNodeController));
export default router;
//# sourceMappingURL=nodeRoutes.js.map