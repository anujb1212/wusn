/**
 * Custom Error Classes
 */
export class AppError extends Error {
    statusCode;
    isOperational;
    context;
    constructor(message, statusCode = 500, isOperational = true, context) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.context = context;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class ValidationError extends AppError {
    constructor(message, context) {
        super(message, 400, true, context);
    }
}
export class NotFoundError extends AppError {
    constructor(resource, identifier) {
        super(`${resource} with identifier '${identifier}' not found`, 404, true, { resource, identifier });
    }
}
export class SensorDataError extends AppError {
    constructor(message, context) {
        super(message, 422, true, context);
    }
}
export class ExternalServiceError extends AppError {
    constructor(service, originalError) {
        super(`External service '${service}' failed`, 502, true, {
            service,
            originalMessage: originalError?.message
        });
    }
}
export class DatabaseError extends AppError {
    constructor(operation, originalError) {
        super(`Database operation '${operation}' failed`, 500, false, {
            operation,
            originalMessage: originalError?.message
        });
    }
}
export function isOperationalError(error) {
    return error instanceof AppError && error.isOperational;
}
//# sourceMappingURL=errors.js.map