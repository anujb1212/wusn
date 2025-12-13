/**
 * Custom Error Classes
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly context?: Record<string, unknown> | undefined;
    readonly cause?: unknown;
    constructor(message: string, statusCode?: number, isOperational?: boolean, context?: Record<string, unknown> | undefined, options?: {
        cause?: unknown;
    });
}
export declare class ValidationError extends AppError {
    constructor(message: string, context?: Record<string, unknown>, cause?: unknown);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string, identifier: string | number, cause?: unknown);
}
export declare class SensorDataError extends AppError {
    constructor(message: string, context?: Record<string, unknown>, cause?: unknown);
}
export declare class ExternalServiceError extends AppError {
    constructor(service: string, originalError?: Error);
}
export declare class DatabaseError extends AppError {
    constructor(operation: string, originalError?: Error);
}
export declare function isOperationalError(error: Error): boolean;
//# sourceMappingURL=errors.d.ts.map