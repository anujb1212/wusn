// src/app.ts
/**
 * Express Application Setup
 */

import express from 'express';
import cors from 'cors';
import { logger } from './config/logger.js';
import { errorHandler, notFoundHandler } from './api/middleware/errorHandler.js';
import sensorRoutes from './routes/sensorRoutes.js';
import fieldRoutes from './routes/fieldRoutes.js';

export function createApp(): express.Application {
    const app = express();

    // Middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Request logging
    app.use((req, res, next) => {
        logger.info({ method: req.method, path: req.path }, 'Request received');
        next();
    });

    // Health check
    app.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'wusn-backend'
        });
    });

    // API Routes
    app.use('/api/sensors', sensorRoutes);
    app.use('/api/fields', fieldRoutes);

    // 404 handler (must be after all routes)
    app.use(notFoundHandler);

    // Error handler (must be last)
    app.use(errorHandler);

    return app;
}
