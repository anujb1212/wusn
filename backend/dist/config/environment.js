// src/config/environment.ts
/**
 * Environment Variables Configuration with Validation
 *
 * IMPORTANT: This file has NO imports to avoid circular dependencies
 * Must be imported first before any other config files
 */
// Load dotenv at the very top - before any other code
import 'dotenv/config';
import { z } from 'zod';
/**
 * Environment variable schema
 */
const envSchema = z.object({
    // Server
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    // Database
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    // MQTT Broker
    MQTT_BROKER_HOST: z.string().default('127.0.0.1'),
    MQTT_BROKER_PORT: z.coerce.number().int().positive().default(1883),
    MQTT_CLIENT_ID: z.string().optional(),
    // OpenWeatherMap API
    OPENWEATHER_API_KEY: z.string().min(1, 'OPENWEATHER_API_KEY is required'),
    // Logging
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    LOG_PRETTY: z.coerce.boolean().default(false),
    // Application
    WEATHER_CACHE_TTL_HOURS: z.coerce.number().positive().default(1),
    GDD_CALCULATION_HOUR: z.coerce.number().int().min(0).max(23).default(1),
});
/**
 * Parse and validate environment variables
 */
function validateEnvironment() {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error('❌ Environment validation failed:');
        console.error(JSON.stringify(result.error.format(), null, 2));
        throw new Error('Invalid environment configuration. Check your .env file.');
    }
    return result.data;
}
/**
 * Validated environment configuration
 * Use this throughout your application
 */
export const env = validateEnvironment();
/**
 * Environment helpers
 */
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
//# sourceMappingURL=environment.js.map