/**
 * Database Configuration
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from './logger.js';
import { env, isDevelopment } from './environment.js';

const logger = createLogger({ service: 'database' });

/**
 * Prisma client instance
 */
export const prisma = new PrismaClient({
    log: isDevelopment
        ? [
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
        ]
        : [{ level: 'error', emit: 'stdout' }],
});

/**
 * Log Prisma queries in development
 */
if (isDevelopment) {
    prisma.$on('query' as never, (e: any) => {
        logger.debug({ query: e.query, params: e.params, duration: e.duration }, 'Prisma query');
    });
}

/**
 * Connect to database
 */
export async function connectDatabase(): Promise<void> {
    try {
        await prisma.$connect();
        logger.info('Database connected successfully');

        // Test connection
        await prisma.$queryRaw`SELECT 1`;
        logger.info('Database connection verified');
    } catch (error) {
        logger.error({ error }, 'Failed to connect to database');
        throw error;
    }
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
    try {
        await prisma.$disconnect();
        logger.info('Database disconnected');
    } catch (error) {
        logger.error({ error }, 'Error disconnecting from database');
        throw error;
    }
}

/**
 * Health check
 */
export async function checkDatabaseHealth(): Promise<boolean> {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        logger.error({ error }, 'Database health check failed');
        return false;
    }
}
