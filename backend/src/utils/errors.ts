// src/utils/errors.ts
/**
 * Custom Error Classes
 */

export class AppError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 500,
        public readonly isOperational: boolean = true,
        public readonly context?: Record<string, unknown>
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, 400, true, context);
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string, identifier: string | number) {
        super(
            `${resource} with identifier '${identifier}' not found`,
            404,
            true,
            { resource, identifier }
        );
    }
}

export class SensorDataError extends AppError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, 422, true, context);
    }
}

export class ExternalServiceError extends AppError {
    constructor(service: string, originalError?: Error) {
        super(
            `External service '${service}' failed`,
            502,
            true,
            {
                service,
                originalMessage: originalError?.message
            }
        );
    }
}

export class DatabaseError extends AppError {
    constructor(operation: string, originalError?: Error) {
        super(
            `Database operation '${operation}' failed`,
            500,
            false,
            {
                operation,
                originalMessage: originalError?.message
            }
        );
    }
}

export function isOperationalError(error: Error): boolean {
    return error instanceof AppError && error.isOperational;
}
