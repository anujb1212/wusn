/**
 * Scheduled Jobs
 * - Daily GDD calculation
 * - Hourly weather cache refresh
 */
import cron from 'node-cron';
import { createLogger } from '../config/logger.js';
import { env } from '../config/environment.js';
import { getFieldsNeedingGDDUpdate } from '../repositories/field.repository.js';
import { calculateMissingGDD } from '../services/gdd/gdd.service.js';
import { cleanExpiredForecasts } from '../repositories/weather.repository.js';
import { getAllFields } from '../repositories/field.repository.js';
import { getWeatherForecast } from '../services/weather/weather.sevice.js';
const logger = createLogger({ service: 'scheduler' });
/**
 * Daily GDD calculation job
 * Runs at configured hour (default 1:00 AM)
 */
export function startGDDCalculationJob() {
    const hour = env.GDD_CALCULATION_HOUR;
    const cronExpression = `0 ${hour} * * *`; // Daily at specified hour
    cron.schedule(cronExpression, async () => {
        logger.info('Starting daily GDD calculation job');
        try {
            const fields = await getFieldsNeedingGDDUpdate();
            logger.info({ count: fields.length }, 'Fields needing GDD update');
            let successCount = 0;
            let failCount = 0;
            for (const field of fields) {
                try {
                    const calculated = await calculateMissingGDD(field.nodeId);
                    logger.info({ nodeId: field.nodeId, calculated }, 'GDD calculation completed for field');
                    successCount++;
                }
                catch (error) {
                    logger.error({ error, nodeId: field.nodeId }, 'GDD calculation failed for field');
                    failCount++;
                }
            }
            logger.info({ total: fields.length, success: successCount, failed: failCount }, 'Daily GDD calculation job completed');
        }
        catch (error) {
            logger.error({ error }, 'Daily GDD calculation job failed');
        }
    });
    logger.info({ cronExpression, hour }, 'GDD calculation job scheduled');
}
/**
 * Hourly weather cache refresh job
 * Pre-fetches weather for all active fields
 */
export function startWeatherCacheJob() {
    const cronExpression = '0 * * * *'; // Every hour at :00
    cron.schedule(cronExpression, async () => {
        logger.info('Starting weather cache refresh job');
        try {
            // Clean expired forecasts first
            const cleaned = await cleanExpiredForecasts();
            logger.info({ cleaned }, 'Expired forecasts cleaned');
            // Get all fields with coordinates
            const fields = await getAllFields();
            const fieldsWithCoords = fields.filter(f => f.latitude && f.longitude);
            // Group fields by location (to avoid duplicate API calls)
            const locationMap = new Map();
            for (const field of fieldsWithCoords) {
                if (field.latitude && field.longitude) {
                    const key = `${field.latitude.toFixed(2)},${field.longitude.toFixed(2)}`;
                    if (!locationMap.has(key)) {
                        locationMap.set(key, { lat: field.latitude, lon: field.longitude });
                    }
                }
            }
            logger.info({ locations: locationMap.size }, 'Unique locations to refresh');
            let successCount = 0;
            let failCount = 0;
            for (const [key, { lat, lon }] of locationMap.entries()) {
                try {
                    await getWeatherForecast(lat, lon);
                    logger.debug({ location: key }, 'Weather forecast refreshed');
                    successCount++;
                    // Rate limiting: wait 1 second between API calls
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                catch (error) {
                    logger.error({ error, location: key }, 'Weather refresh failed');
                    failCount++;
                }
            }
            logger.info({ total: locationMap.size, success: successCount, failed: failCount }, 'Weather cache refresh job completed');
        }
        catch (error) {
            logger.error({ error }, 'Weather cache refresh job failed');
        }
    });
    logger.info({ cronExpression }, 'Weather cache refresh job scheduled');
}
/**
 * Start all scheduled jobs
 */
export function startScheduler() {
    logger.info('Initializing scheduler');
    startGDDCalculationJob();
    startWeatherCacheJob();
    logger.info('All scheduled jobs started');
}
/**
 * Validate cron expression
 */
export function validateCronExpression(expression) {
    return cron.validate(expression);
}
//# sourceMappingURL=scheduler.js.map