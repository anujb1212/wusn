/**
 * Database Configuration
 */
import { PrismaClient } from '@prisma/client';
declare global {
    var __prisma: PrismaClient<typeof clientOptions> | undefined;
}
/**
 * IMPORTANT:
 * We include event-based log levels in the PrismaClient options so TypeScript
 * correctly types prisma.$on('query' | 'error' | 'warn' | 'info', ...). [web:218][web:197]
 *
 * Logging is still effectively controlled by whether we register listeners.
 */
declare const clientOptions: {
    log: ({
        emit: "event";
        level: "query";
    } | {
        emit: "event";
        level: "error";
    } | {
        emit: "event";
        level: "warn";
    })[];
};
/**
 * Prisma client singleton
 * - Dev: reuse global instance to avoid multiple connections in hot reload scenarios. [web:197]
 * - Prod: module singleton is sufficient.
 */
export declare const prisma: PrismaClient<typeof clientOptions>;
/**
 * Connect to database
 */
export declare function connectDatabase(): Promise<void>;
/**
 * Disconnect from database
 */
export declare function disconnectDatabase(): Promise<void>;
/**
 * Health check
 */
export declare function checkDatabaseHealth(): Promise<boolean>;
export {};
//# sourceMappingURL=database.d.ts.map