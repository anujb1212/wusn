import * as dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

import { z } from 'zod';

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
    MQTT_USERNAME: z.string().optional(),
    MQTT_PASSWORD: z.string().optional(),

    // OpenWeatherMap API
    OPENWEATHER_API_KEY: z.string().min(1, 'OPENWEATHER_API_KEY is required'),

    // Logging
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    LOG_PRETTY: z.coerce.boolean().default(false),

    // Application
    WEATHER_CACHE_TTL_HOURS: z.coerce.number().positive().default(1),
    GDD_CALCULATION_HOUR: z.coerce.number().int().min(0).max(23).default(1),
});

export type Environment = z.infer<typeof envSchema>;

function validateEnvironment(): Environment {
    if (process.env.NODE_ENV === 'production') {
        console.log('DB URL exists:', !!process.env.DATABASE_URL);
        console.log('OWM KEY exists:', !!process.env.OPENWEATHER_API_KEY);
    }

    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        console.error('❌ Environment validation failed:');
        console.error(JSON.stringify(result.error.format(), null, 2));
        throw new Error('Invalid environment configuration. Check your .env file.');
    }

    return result.data;
}

export const env = validateEnvironment();

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';
