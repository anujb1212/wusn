/**
 * Global Error Handler Middleware
 *
 * Handles all errors from controllers and services
 * Provides consistent error responses across the API
 */

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createLogger } from '../../config/logger.js';
import { AppError, isOperationalError } from '../../utils/errors.js';
import { isDevelopment } from '../../config/environment.js';

const logger = createLogger({ service: 'error-handler' });

function formatZodError(error: z.ZodError) {
    return {
        type: 'ValidationError',
        message: 'Invalid request data',
        details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
        })),
    };
}

/**
 * Global error handler
 * Must have 4 parameters for Express to recognize it as error middleware. [web:261]
 */
export function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): void {
    const logContext = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
    };

    if (isOperationalError(error)) {
        logger.warn({ err: error, ...logContext }, 'Operational error');
    } else {
        logger.error({ err: error, ...logContext }, 'Unexpected error');
    }

    // Zod validation errors
    if (error instanceof z.ZodError) {
        const formattedError = formatZodError(error);
        res.status(400).json({
            success: false,
            error: formattedError,
            timestamp: new Date().toISOString(),
        });
        return;
    }

    // Custom AppError instances
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            success: false,
            error: {
                type: error.name,
                message: error.message,
                ...(isDevelopment && error.context ? { context: error.context } : {}),
            },
            timestamp: new Date().toISOString(),
        });
        return;
    }

    // Unknown errors (programming errors)
    res.status(500).json({
        success: false,
        error: {
            type: 'InternalServerError',
            message: isDevelopment ? error.message : 'An unexpected error occurred',
            ...(isDevelopment ? { stack: error.stack } : {}),
        },
        timestamp: new Date().toISOString(),
    });
}

/**
 * 404 handler for unmatched routes
 * Should be registered AFTER all routes but BEFORE error handler.
 */
export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
        success: false,
        error: {
            type: 'NotFoundError',
            message: `Route ${req.method} ${req.originalUrl} not found`,
        },
        timestamp: new Date().toISOString(),
    });
}
