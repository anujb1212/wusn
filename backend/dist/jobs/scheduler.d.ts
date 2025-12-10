/**
 * Scheduled Jobs
 * - Daily GDD calculation
 * - Hourly weather cache refresh
 */
/**
 * Daily GDD calculation job
 * Runs at configured hour (default 1:00 AM)
 */
export declare function startGDDCalculationJob(): void;
/**
 * Hourly weather cache refresh job
 * Pre-fetches weather for all active fields
 */
export declare function startWeatherCacheJob(): void;
/**
 * Start all scheduled jobs
 */
export declare function startScheduler(): void;
/**
 * Validate cron expression
 */
export declare function validateCronExpression(expression: string): boolean;
//# sourceMappingURL=scheduler.d.ts.map