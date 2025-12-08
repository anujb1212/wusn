// src/routes/fieldRoutes.ts
/**
 * Field Routes
 */

import { Router } from 'express';
import { asyncHandler } from '../api/middleware/asyncHandler.js';
import {
    createField,
    getAllFields,
    getField,
    updateField,
    deleteField
} from '../controllers/fieldController.js';

const router = Router();

router.post('/', asyncHandler(createField));
router.get('/', asyncHandler(getAllFields));
router.get('/:nodeId', asyncHandler(getField));
router.patch('/:nodeId', asyncHandler(updateField));
router.delete('/:nodeId', asyncHandler(deleteField));

export default router;
