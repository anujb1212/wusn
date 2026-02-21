/**
 * Custom Error Classes
 */

export class AppError extends Error {
    public readonly cause?: unknown;

    constructor(
        message: string,
        public readonly statusCode: number = 500,
        public readonly isOperational: boolean = true,
        public readonly context?: Record<string, unknown>,
        options?: { cause?: unknown }
    ) {
        super(message);
        this.name = this.constructor.name;
        this.cause = options?.cause;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string, context?: Record<string, unknown>, cause?: unknown) {
        super(message, 400, true, context, { cause });
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string, identifier: string | number, cause?: unknown) {
        super(
            `${resource} with identifier '${identifier}' not found`,
            404,
            true,
            { resource, identifier },
            { cause }
        );
    }
}

export class SensorDataError extends AppError {
    constructor(message: string, context?: Record<string, unknown>, cause?: unknown) {
        super(message, 422, true, context, { cause });
    }
}

export class ExternalServiceError extends AppError {
    constructor(service: string, originalError?: Error) {
        super(
            `External service '${service}' failed`,
            502,
            true,
            { service, originalMessage: originalError?.message },
            { cause: originalError }
        );
    }
}

export class DatabaseError extends AppError {
    constructor(operation: string, originalError?: Error) {
        // Database failures are typically operational (timeouts, outages, constraint failures).
        super(
            `Database operation '${operation}' failed`,
            500,
            true,
            { operation, originalMessage: originalError?.message },
            { cause: originalError }
        );
    }
}

export function isOperationalError(error: Error): boolean {
    return error instanceof AppError && error.isOperational;
}
