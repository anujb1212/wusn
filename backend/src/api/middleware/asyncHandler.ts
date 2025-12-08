// src/api/middleware/asyncHandler.ts
/**
 * Async Handler Wrapper
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Wrap async route handlers to catch errors
 */
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
