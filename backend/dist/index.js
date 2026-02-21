/**
 * Application Entry Point
 */
import { createApp } from './app.js';
import { env } from './config/environment.js';
import { createLogger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { initializeMQTT, disconnectMQTT } from './services/mqtt.service.js';
import { startScheduler } from './jobs/scheduler.js';
const logger = createLogger({ service: 'main' });
async function start() {
    let shuttingDown = false;
    try {
        logger.info('Starting WUSN Backend');
        await connectDatabase();
        initializeMQTT();
        const app = createApp();
        const server = app.listen(env.PORT, () => {
            logger.info({ port: env.PORT, env: env.NODE_ENV, pid: process.pid }, 'HTTP server listening');
        });
        // If startScheduler later returns a stop function, wire it here without breaking builds:
        const schedulerHandle = startScheduler();
        const closeServer = () => new Promise((resolve) => {
            server.close(() => {
                logger.info('HTTP server closed');
                resolve();
            });
        });
        const shutdown = async (signal) => {
            if (shuttingDown)
                return;
            shuttingDown = true;
            logger.info({ signal }, 'Shutdown signal received');
            try {
                // Stop accepting new connections first
                await closeServer();
                // Stop scheduled jobs if the scheduler exposes a stop/close API (future-proof)
                const maybeStop = schedulerHandle?.stop ?? schedulerHandle?.close;
                if (typeof maybeStop === 'function') {
                    await maybeStop.call(schedulerHandle);
                    logger.info('Scheduler stopped');
                }
                await disconnectMQTT();
                await disconnectDatabase();
                logger.info('Graceful shutdown complete');
                process.exit(0);
            }
            catch (error) {
                logger.error({ error }, 'Error during shutdown');
                process.exit(1);
            }
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('uncaughtException', (error) => {
            logger.error({ error }, 'Uncaught exception');
            void shutdown('uncaughtException');
        });
        process.on('unhandledRejection', (reason) => {
            logger.error({ reason }, 'Unhandled rejection');
            void shutdown('unhandledRejection');
        });
    }
    catch (error) {
        logger.error({ error }, 'Failed to start application');
        process.exit(1);
    }
}
start();
//# sourceMappingURL=index.js.map