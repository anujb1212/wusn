/**
 * Structured Logger using Pino
 */
import pino from 'pino';
/**
 * Main application logger
 */
export declare const logger: pino.Logger<never, boolean>;
/**
 * Create child logger with context
 */
export declare function createLogger(context: Record<string, unknown>): pino.Logger;
/**
 * Flush logs before exit
 */
export declare function flushLogs(): Promise<void>;
//# sourceMappingURL=logger.d.ts.map