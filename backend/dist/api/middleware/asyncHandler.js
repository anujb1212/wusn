// src/api/middleware/asyncHandler.ts
/**
 * Async Handler Wrapper
 */
/**
 * Wrap async route handlers to catch errors
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=asyncHandler.js.map