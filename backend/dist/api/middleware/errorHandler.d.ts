/**
 * Global Error Handler Middleware
 */
import type { Request, Response, NextFunction } from 'express';
/**
 * Global error handler
 */
export declare function errorHandler(error: Error, req: Request, res: Response, next: NextFunction): void;
/**
 * 404 handler
 */
export declare function notFoundHandler(req: Request, res: Response): void;
//# sourceMappingURL=errorHandler.d.ts.map