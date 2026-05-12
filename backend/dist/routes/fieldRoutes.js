import { Router } from 'express';
import { asyncHandler } from '../api/middleware/asyncHandler.js';
import { createFieldController, getAllFieldsController, getFieldController, updateFieldController, deleteFieldController, setCropController, harvestCropController, assignNodeToFieldController, getFieldNodesController, } from '../controllers/fieldController.js';
const router = Router();
// Field CRUD (collection)
router.post('/', asyncHandler(createFieldController));
router.get('/', asyncHandler(getAllFieldsController));
router.post('/:fieldId/crop', asyncHandler(setCropController));
router.post('/:fieldId/harvest', asyncHandler(harvestCropController));
// Field CRUD (single)
router.get('/:fieldId', asyncHandler(getFieldController));
router.patch('/:fieldId', asyncHandler(updateFieldController));
router.delete('/:fieldId', asyncHandler(deleteFieldController));
router.post('/:fieldId/nodes/:nodeId', asyncHandler(assignNodeToFieldController));
router.get('/:fieldId/nodes', asyncHandler(getFieldNodesController));
export default router;
//# sourceMappingURL=fieldRoutes.js.map