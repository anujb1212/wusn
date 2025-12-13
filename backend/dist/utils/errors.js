/**
 * Custom Error Classes
 */
export class AppError extends Error {
    statusCode;
    isOperational;
    context;
    cause;
    constructor(message, statusCode = 500, isOperational = true, context, options) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.context = context;
        this.name = this.constructor.name;
        this.cause = options?.cause;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class ValidationError extends AppError {
    constructor(message, context, cause) {
        super(message, 400, true, context, { cause });
    }
}
export class NotFoundError extends AppError {
    constructor(resource, identifier, cause) {
        super(`${resource} with identifier '${identifier}' not found`, 404, true, { resource, identifier }, { cause });
    }
}
export class SensorDataError extends AppError {
    constructor(message, context, cause) {
        super(message, 422, true, context, { cause });
    }
}
export class ExternalServiceError extends AppError {
    constructor(service, originalError) {
        super(`External service '${service}' failed`, 502, true, { service, originalMessage: originalError?.message }, { cause: originalError });
    }
}
export class DatabaseError extends AppError {
    constructor(operation, originalError) {
        // Database failures are typically operational (timeouts, outages, constraint failures).
        super(`Database operation '${operation}' failed`, 500, true, { operation, originalMessage: originalError?.message }, { cause: originalError });
    }
}
export function isOperationalError(error) {
    return error instanceof AppError && error.isOperational;
}
//# sourceMappingURL=errors.js.map