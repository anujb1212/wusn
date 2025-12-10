/**
 * Database Configuration
 */
import { PrismaClient } from '@prisma/client';
/**
 * Prisma client instance
 */
export declare const prisma: PrismaClient<{
    log: ({
        level: "query";
        emit: "event";
    } | {
        level: "error";
        emit: "stdout";
    } | {
        level: "warn";
        emit: "stdout";
    })[];
}, "query", import("@prisma/client/runtime/library").DefaultArgs>;
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
//# sourceMappingURL=database.d.ts.map