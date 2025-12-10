import type { Request, Response } from 'express';
/**
 * POST /api/fields
 */
export declare function createFieldController(req: Request, res: Response): Promise<void>;
/**
 * GET /api/fields/:nodeId
 */
export declare function getFieldController(req: Request, res: Response): Promise<void>;
/**
 * GET /api/fields
 */
export declare function getAllFieldsController(_req: Request, res: Response): Promise<void>;
/**
 * PATCH /api/fields/:nodeId
 */
export declare function updateFieldController(req: Request, res: Response): Promise<void>;
/**
 * POST /api/fields/:nodeId/crop
 * ✅ FIXED: Only accepts 9 crops from UP_VALID_CROPS
 */
export declare function setCropController(req: Request, res: Response): Promise<void>;
/**
 * DELETE /api/fields/:nodeId
 */
export declare function deleteFieldController(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=fieldController.d.ts.map