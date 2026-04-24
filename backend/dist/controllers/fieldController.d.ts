import type { Request, Response } from 'express';
export declare function createFieldController(req: Request, res: Response): Promise<void>;
export declare function getFieldController(req: Request, res: Response): Promise<void>;
export declare function getAllFieldsController(_req: Request, res: Response): Promise<void>;
export declare function updateFieldController(req: Request, res: Response): Promise<void>;
/**
 * POST /api/fields/:nodeId/crop
 * DB-driven validation: cropType must exist in CropParameters.cropName (validForUP=true).
 */
export declare function setCropController(req: Request, res: Response): Promise<void>;
export declare function deleteFieldController(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=fieldController.d.ts.map