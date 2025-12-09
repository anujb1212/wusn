// src/app.ts
/**
 * Express Application Setup
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger } from './config/logger.js';
import { errorHandler } from './api/middleware/errorHandler.js';
// Import routes
import sensorRoutes from './routes/sensorRoutes.js';
import fieldRoutes from './routes/fieldRoutes.js';
import weatherRoutes from './routes/weather.routes.js';
import gddRoutes from './routes/gdd.routes.js';
import cropRoutes from './routes/crop.routes.js';
import irrigationRoutes from './routes/irrigation.routes.js';
const logger = createLogger({ service: 'app' });
/**
 * Create Express application
 */
export function createApp() {
    const app = express();
    // Security middleware
    app.use(helmet());
    app.use(cors());
    // Body parsing middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    // Request logging
    app.use((req, _res, next) => {
        logger.debug({ method: req.method, path: req.path }, 'Incoming request');
        next();
    });
    // Health check endpoint
    app.get('/health', (_req, res) => {
        res.json({
            status: 'ok',
            service: 'wusn-backend',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    });
    // API routes
    app.use('/api/sensors', sensorRoutes);
    app.use('/api/fields', fieldRoutes);
    app.use('/api/weather', weatherRoutes);
    app.use('/api/gdd', gddRoutes);
    app.use('/api/crops', cropRoutes);
    app.use('/api/irrigation', irrigationRoutes);
    // 404 handler
    app.use((_req, res) => {
        res.status(404).json({
            status: 'error',
            message: 'Route not found',
            timestamp: new Date().toISOString(),
        });
    });
    // Error handling middleware (must be last)
    app.use(errorHandler);
    logger.info('Express application configured');
    return app;
}
//# sourceMappingURL=app.js.map