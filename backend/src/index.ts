// src/index.ts
/**
 * Application Entry Point
 */

import { env } from './config/environment.js';
import { logger } from './config/logger.js';
import { disconnectPrisma } from './config/database.js';
import { flushLogs } from './config/logger.js';
import { createApp } from './app.js';
import { initializeMQTT, disconnectMQTT } from './services/mqtt.service.js';

const app = createApp();

// Start HTTP server
const server = app.listen(env.PORT, () => {
    logger.info(
        {
            port: env.PORT,
            env: env.NODE_ENV,
            nodeVersion: process.version
        },
        'Server started successfully'
    );
});

// Initialize MQTT connection
initializeMQTT();
logger.info('MQTT service initialized');

// Graceful shutdown handler
async function shutdown(signal: string): Promise<void> {
    logger.info({ signal }, 'Shutdown signal received');

    // Stop accepting new connections
    server.close(async () => {
        logger.info('HTTP server closed');

        try {
            // Cleanup resources
            await disconnectMQTT();
            await disconnectPrisma();
            await flushLogs();

            logger.info('Graceful shutdown completed');
            process.exit(0);
        } catch (error) {
            logger.error({ err: error }, 'Error during shutdown');
            process.exit(1);
        }
    });

    // Force exit after 10 seconds
    setTimeout(() => {
        logger.error('Forcing shutdown after timeout');
        process.exit(1);
    }, 10000);
}

// Register shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught exception');
    shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled rejection');
    shutdown('unhandledRejection');
});
