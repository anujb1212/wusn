import pino from 'pino';
export declare const logger: pino.Logger<never, boolean>;
export declare function createLogger(context: Record<string, unknown>): pino.Logger;
export declare function flushLogs(): Promise<void>;
//# sourceMappingURL=logger.d.ts.map