/**
 * Global Error Handler Middleware
 *
 * Handles all errors from controllers and services
 * Provides consistent error responses across the API
 */
import type { Request, Response, NextFunction } from 'express';
/**
 * Global error handler
 *
 * Must have 4 parameters for Express to recognize it as error middleware
 */
export declare function errorHandler(error: Error, req: Request, res: Response, next: NextFunction): void;
/**
 * 404 handler for unmatched routes
 *
 * Should be registered AFTER all routes but BEFORE error handler
 */
export declare function notFoundHandler(req: Request, res: Response): void;
/**
 * Async handler wrapper for Express routes
 *
 * Catches promise rejections and passes them to error middleware
 * Eliminates need for try-catch in every controller
 *
 * Usage:
 * router.get('/path', asyncHandler(myAsyncController));
 */
export declare function asyncHandler(fn: Function): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map