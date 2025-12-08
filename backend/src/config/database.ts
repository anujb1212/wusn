// src/config/database.ts
/**
 * Singleton Prisma Client
 * 
 * IMPORTANT: Uses console.log for initialization to avoid circular dependency with logger
 */

import { PrismaClient } from '@prisma/client';
import { env, isDevelopment } from './environment.js';

/**
 * Global singleton instance
 */
let prismaInstance: PrismaClient | undefined;

/**
 * Get Prisma client instance
 */
export function getPrismaClient(): PrismaClient {
    if (!prismaInstance) {
        prismaInstance = new PrismaClient({
            log: isDevelopment
                ? ['query', 'error', 'warn']
                : ['error'],
        });

        // Log initialization (using console to avoid circular dependency)
        console.log('[Database] Prisma Client initialized');
    }

    return prismaInstance;
}

/**
 * Disconnect Prisma client
 */
export async function disconnectPrisma(): Promise<void> {
    if (prismaInstance) {
        await prismaInstance.$disconnect();
        prismaInstance = undefined;
        console.log('[Database] Prisma Client disconnected');
    }
}

/**
 * Export singleton instance
 */
export const prisma = getPrismaClient();
