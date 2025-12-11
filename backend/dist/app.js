import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger } from './config/logger.js';
import { errorHandler, notFoundHandler } from './api/middleware/errorHandler.js';
// Import routes
import sensorRoutes from './routes/sensorRoutes.js';
import fieldRoutes from './routes/fieldRoutes.js';
import cropRoutes from './routes/crop.routes.js';
import irrigationRoutes from './routes/irrigation.routes.js';
import gddRoutes from './routes/gdd.routes.js';
import weatherRoutes from './routes/weather.routes.js';
import nodeRoutes from './routes/nodeRoutes.js';
const logger = createLogger({ service: 'app' });
export function createApp() {
    const app = express();
    // Middleware
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    // Health check
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    // API Routes
    app.use('/api/sensors', sensorRoutes);
    app.use('/api/fields', fieldRoutes);
    app.use('/api/crops', cropRoutes);
    app.use('/api/irrigation', irrigationRoutes);
    app.use('/api/gdd', gddRoutes);
    app.use('/api/weather', weatherRoutes);
    app.use('/api/nodes', nodeRoutes);
    // 404 handler (must be AFTER all routes)
    app.use(notFoundHandler);
    // Error handling (must be LAST)
    app.use(errorHandler);
    logger.info('Express application configured');
    return app;
}
//# sourceMappingURL=app.js.map