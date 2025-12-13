/**
 * Async Handler Wrapper
 */
import type { Request, Response, NextFunction } from 'express';
/**
 * Wrap async route handlers to catch errors
 */
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=asyncHandler.d.ts.map