/**
 * Field Routes
 */
import { Router } from 'express';
import { asyncHandler } from '../api/middleware/asyncHandler.js';
import { createFieldController, getAllFieldsController, getFieldController, updateFieldController, deleteFieldController, setCropController, } from '../controllers/fieldController.js';
const router = Router();
// Field CRUD
router.post('/', asyncHandler(createFieldController));
router.get('/', asyncHandler(getAllFieldsController));
router.get('/:nodeId', asyncHandler(getFieldController));
router.patch('/:nodeId', asyncHandler(updateFieldController));
router.delete('/:nodeId', asyncHandler(deleteFieldController));
// Crop configuration
router.post('/:nodeId/crop', asyncHandler(setCropController));
export default router;
//# sourceMappingURL=fieldRoutes.js.map