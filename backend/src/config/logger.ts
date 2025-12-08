// src/config/logger.ts
/**
 * Structured Logger using Pino
 */

import pino from 'pino';
import { env } from './environment.js';

/**
 * Base logger options (without transport)
 */
const baseOptions: pino.LoggerOptions = {
    level: env.LOG_LEVEL,

    serializers: {
        err: pino.stdSerializers.err,
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
    },

    base: {
        env: env.NODE_ENV,
    },

    timestamp: pino.stdTimeFunctions.isoTime,
};

/**
 * Create logger with or without pretty printing
 */
const baseLogger = env.LOG_PRETTY
    ? pino({
        ...baseOptions,
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
    })
    : pino(baseOptions);

/**
 * Main application logger
 */
export const logger = baseLogger;

/**
 * Create child logger with context
 */
export function createLogger(context: Record<string, unknown>): pino.Logger {
    return logger.child(context);
}

/**
 * Flush logs before exit
 */
export function flushLogs(): Promise<void> {
    return new Promise((resolve) => {
        logger.flush();
        setTimeout(resolve, 100);
    });
}
