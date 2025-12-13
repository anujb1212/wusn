/**
 * Global Error Handler Middleware
 *
 * Handles all errors from controllers and services
 * Provides consistent error responses across the API
 */
import type { Request, Response, NextFunction } from 'express';
/**
 * Global error handler
 * Must have 4 parameters for Express to recognize it as error middleware. [web:261]
 */
export declare function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): void;
/**
 * 404 handler for unmatched routes
 * Should be registered AFTER all routes but BEFORE error handler.
 */
export declare function notFoundHandler(req: Request, res: Response): void;
//# sourceMappingURL=errorHandler.d.ts.map