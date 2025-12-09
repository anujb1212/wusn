// src/index.ts
/**
 * Application Entry Point
 */
import { createApp } from './app.js';
import { env, isDevelopment } from './config/environment.js';
import { createLogger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { initializeMQTT, disconnectMQTT } from './services/mqtt.service.js';
import { startScheduler } from './jobs/scheduler.js';
const logger = createLogger({ service: 'main' });
/**
 * Start the application
 */
async function start() {
    try {
        logger.info('Starting WUSN Backend');
        // Connect to database
        await connectDatabase();
        // Initialize MQTT
        initializeMQTT();
        // Create Express app
        const app = createApp();
        // Start HTTP server
        const server = app.listen(env.PORT, () => {
            logger.info({
                port: env.PORT,
                env: env.NODE_ENV,
                pid: process.pid,
            }, 'HTTP server listening');
        });
        // Start scheduled jobs
        startScheduler();
        // Graceful shutdown handler
        const shutdown = async (signal) => {
            logger.info({ signal }, 'Shutdown signal received');
            // Stop accepting new connections
            server.close(() => {
                logger.info('HTTP server closed');
            });
            try {
                // Disconnect MQTT
                await disconnectMQTT();
                // Disconnect database
                await disconnectDatabase();
                logger.info('Graceful shutdown complete');
                process.exit(0);
            }
            catch (error) {
                logger.error({ error }, 'Error during shutdown');
                process.exit(1);
            }
        };
        // Handle shutdown signals
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        // Handle uncaught errors
        process.on('uncaughtException', (error) => {
            logger.error({ error }, 'Uncaught exception');
            shutdown('uncaughtException');
        });
        process.on('unhandledRejection', (reason) => {
            logger.error({ reason }, 'Unhandled rejection');
            shutdown('unhandledRejection');
        });
    }
    catch (error) {
        logger.error({ error }, 'Failed to start application');
        process.exit(1);
    }
}
// Start the application
start();
//# sourceMappingURL=index.js.map