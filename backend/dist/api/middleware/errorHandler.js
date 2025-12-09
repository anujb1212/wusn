// src/api/middleware/errorHandler.ts
/**
 * Global Error Handler Middleware
 */
import { logger } from '../../config/logger.js';
import { AppError, isOperationalError } from '../../utils/errors.js';
import { isDevelopment } from '../../config/environment.js';
/**
 * Global error handler
 */
export function errorHandler(error, req, res, next) {
    // Log error
    logger.error({
        err: error,
        path: req.path,
        method: req.method,
    }, 'Request error');
    // Handle operational errors
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            status: 'error',
            message: error.message,
            ...(isDevelopment && { context: error.context }),
            timestamp: new Date().toISOString(),
        });
        return;
    }
    // Handle unknown errors
    res.status(500).json({
        status: 'error',
        message: isDevelopment ? error.message : 'Internal server error',
        timestamp: new Date().toISOString(),
    });
}
/**
 * 404 handler
 */
export function notFoundHandler(req, res) {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString(),
    });
}
//# sourceMappingURL=errorHandler.js.map