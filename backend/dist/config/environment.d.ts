/**
 * Environment Variables Configuration with Validation
 *
 * IMPORTANT: This file has NO imports to avoid circular dependencies
 * Must be imported first before any other config files
 */
import 'dotenv/config';
import { z } from 'zod';
/**
 * Environment variable schema
 */
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    PORT: z.ZodDefault<z.ZodNumber>;
    DATABASE_URL: z.ZodString;
    MQTT_BROKER_HOST: z.ZodDefault<z.ZodString>;
    MQTT_BROKER_PORT: z.ZodDefault<z.ZodNumber>;
    MQTT_CLIENT_ID: z.ZodOptional<z.ZodString>;
    OPENWEATHER_API_KEY: z.ZodString;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["fatal", "error", "warn", "info", "debug", "trace"]>>;
    LOG_PRETTY: z.ZodDefault<z.ZodBoolean>;
    WEATHER_CACHE_TTL_HOURS: z.ZodDefault<z.ZodNumber>;
    GDD_CALCULATION_HOUR: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    DATABASE_URL: string;
    MQTT_BROKER_HOST: string;
    MQTT_BROKER_PORT: number;
    OPENWEATHER_API_KEY: string;
    LOG_LEVEL: "fatal" | "error" | "warn" | "info" | "debug" | "trace";
    LOG_PRETTY: boolean;
    WEATHER_CACHE_TTL_HOURS: number;
    GDD_CALCULATION_HOUR: number;
    MQTT_CLIENT_ID?: string | undefined;
}, {
    DATABASE_URL: string;
    OPENWEATHER_API_KEY: string;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    PORT?: number | undefined;
    MQTT_BROKER_HOST?: string | undefined;
    MQTT_BROKER_PORT?: number | undefined;
    MQTT_CLIENT_ID?: string | undefined;
    LOG_LEVEL?: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | undefined;
    LOG_PRETTY?: boolean | undefined;
    WEATHER_CACHE_TTL_HOURS?: number | undefined;
    GDD_CALCULATION_HOUR?: number | undefined;
}>;
/**
 * Validated environment variables type
 */
export type Environment = z.infer<typeof envSchema>;
/**
 * Validated environment configuration
 * Use this throughout your application
 */
export declare const env: {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    DATABASE_URL: string;
    MQTT_BROKER_HOST: string;
    MQTT_BROKER_PORT: number;
    OPENWEATHER_API_KEY: string;
    LOG_LEVEL: "fatal" | "error" | "warn" | "info" | "debug" | "trace";
    LOG_PRETTY: boolean;
    WEATHER_CACHE_TTL_HOURS: number;
    GDD_CALCULATION_HOUR: number;
    MQTT_CLIENT_ID?: string | undefined;
};
/**
 * Environment helpers
 */
export declare const isProduction: boolean;
export declare const isDevelopment: boolean;
export declare const isTest: boolean;
export {};
//# sourceMappingURL=environment.d.ts.map