/**
 * Global Error Handler Middleware
 * 
 * Handles all errors from controllers and services
 * Provides consistent error responses across the API
 */

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../../config/logger.js';
import { AppError, isOperationalError } from '../../utils/errors.js';
import { isDevelopment } from '../../config/environment.js';

/**
 * Format Zod validation errors into readable format
 */
function formatZodError(error: z.ZodError) {
    return {
        type: 'ValidationError',
        message: 'Invalid request data',
        details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
        })),
    };
}

/**
 * Global error handler
 * 
 * Must have 4 parameters for Express to recognize it as error middleware
 */
export function errorHandler(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Log error with request context
    const logContext = {
        path: req.path,
        method: req.method,
        query: req.query,
        ip: req.ip,
    };

    if (isOperationalError(error)) {
        // Expected errors (validation, not found, etc.)
        logger.warn({
            err: error,
            ...logContext,
        }, 'Operational error');
    } else {
        // Unexpected errors (bugs, database failures, etc.)
        logger.error({
            err: error,
            stack: error.stack,
            ...logContext,
        }, 'Unexpected error');
    }

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
        const formattedError = formatZodError(error);
        res.status(400).json({
            success: false,
            error: formattedError,
            timestamp: new Date().toISOString(),
        });
        return;
    }

    // Handle custom AppError instances
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            success: false,
            error: {
                type: error.name,
                message: error.message,
                ...(isDevelopment && error.context && { context: error.context }),
            },
            timestamp: new Date().toISOString(),
        });
        return;
    }

    // Handle unknown errors (programming errors)
    res.status(500).json({
        success: false,
        error: {
            type: 'InternalServerError',
            message: isDevelopment ? error.message : 'An unexpected error occurred',
            ...(isDevelopment && { stack: error.stack }),
        },
        timestamp: new Date().toISOString(),
    });
}

/**
 * 404 handler for unmatched routes
 * 
 * Should be registered AFTER all routes but BEFORE error handler
 */
export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
        success: false,
        error: {
            type: 'NotFoundError',
            message: `Route ${req.method} ${req.path} not found`,
        },
        timestamp: new Date().toISOString(),
    });
}

/**
 * Async handler wrapper for Express routes
 * 
 * Catches promise rejections and passes them to error middleware
 * Eliminates need for try-catch in every controller
 * 
 * Usage:
 * router.get('/path', asyncHandler(myAsyncController));
 */
export function asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
