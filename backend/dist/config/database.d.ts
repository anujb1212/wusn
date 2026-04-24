import { PrismaClient } from '@prisma/client';
declare global {
    var __prisma: PrismaClient<typeof clientOptions> | undefined;
}
/**
 * We include event-based log levels in the PrismaClient options so TypeScript
 * correctly types prisma.$on('query' | 'error' | 'warn' | 'info', ...)
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
export declare function connectDatabase(): Promise<void>;
export declare function disconnectDatabase(): Promise<void>;
export declare function checkDatabaseHealth(): Promise<boolean>;
export {};
//# sourceMappingURL=database.d.ts.map