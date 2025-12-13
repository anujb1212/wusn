/**
 * Field Routes
 */

import { Router } from 'express';
import { asyncHandler } from '../api/middleware/asyncHandler.js';
import {
    createFieldController,
    getAllFieldsController,
    getFieldController,
    updateFieldController,
    deleteFieldController,
    setCropController,
} from '../controllers/fieldController.js';

const router = Router();

// Field CRUD (collection)
router.post('/', asyncHandler(createFieldController));
router.get('/', asyncHandler(getAllFieldsController));

// Crop configuration (more specific route first; avoids future conflicts)
router.post('/:nodeId/crop', asyncHandler(setCropController));

// Field CRUD (single)
router.get('/:nodeId', asyncHandler(getFieldController));
router.patch('/:nodeId', asyncHandler(updateFieldController));
router.delete('/:nodeId', asyncHandler(deleteFieldController));

export default router;
