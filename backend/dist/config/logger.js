import pino from 'pino';
import { env } from './environment.js';
const baseOptions = {
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
const baseLogger = env.LOG_PRETTY
    ? pino({
        ...baseOptions,
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
                ignore: 'pid,hostname',
            },
        },
    })
    : pino({
        ...baseOptions,
        timestamp: () => `,"time":"${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}"`,
    });
export const logger = baseLogger;
export function createLogger(context) {
    return logger.child(context);
}
export function flushLogs() {
    return new Promise((resolve) => {
        logger.flush();
        setTimeout(resolve, 100);
    });
}
//# sourceMappingURL=logger.js.map