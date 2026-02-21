/**
 * Database Configuration
 */

import { Prisma, PrismaClient } from '@prisma/client';
import { createLogger } from './logger.js';
import { isDevelopment } from './environment.js';

const logger = createLogger({ service: 'database' });

declare global {
    // eslint-disable-next-line no-var
    var __prisma: PrismaClient<typeof clientOptions> | undefined;
}

/**
 * IMPORTANT:
 * We include event-based log levels in the PrismaClient options so TypeScript
 * correctly types prisma.$on('query' | 'error' | 'warn' | 'info', ...). [web:218][web:197]
 *
 * Logging is still effectively controlled by whether we register listeners.
 */
const clientOptions = {
    log: [
        { emit: 'event' as const, level: 'query' as const },
        { emit: 'event' as const, level: 'error' as const },
        { emit: 'event' as const, level: 'warn' as const },
        // Keep info optional; enable if you use it
        // { emit: 'event' as const, level: 'info' as const },
    ],
};

function createPrismaClient() {
    return new PrismaClient(clientOptions);
}

/**
 * Prisma client singleton
 * - Dev: reuse global instance to avoid multiple connections in hot reload scenarios. [web:197]
 * - Prod: module singleton is sufficient.
 */
export const prisma: PrismaClient<typeof clientOptions> =
    isDevelopment
        ? (globalThis.__prisma ?? (globalThis.__prisma = createPrismaClient()))
        : createPrismaClient();

/**
 * Toggle query logging explicitly (dev-only).
 * Avoid logging params by default.
 */
const enableQueryLogging =
    isDevelopment && String(process.env.PRISMA_LOG_QUERIES ?? '').toLowerCase() === 'true';

if (enableQueryLogging) {
    prisma.$on('query', (e: Prisma.QueryEvent) => {
        logger.debug({ query: e.query, durationMs: e.duration }, 'Prisma query');
    });
}

prisma.$on('error', (e: Prisma.LogEvent) => {
    logger.error({ message: e.message, target: e.target }, 'Prisma error');
});

prisma.$on('warn', (e: Prisma.LogEvent) => {
    logger.warn({ message: e.message, target: e.target }, 'Prisma warning');
});

/**
 * Connect to database
 */
export async function connectDatabase(): Promise<void> {
    try {
        await prisma.$connect();
        logger.info('Database connected successfully');

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
