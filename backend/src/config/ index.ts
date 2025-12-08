// src/config/index.ts
/**
 * Configuration exports
 */

export { env, isProduction, isDevelopment, isTest, type Environment } from './environment.js';
export { logger, createLogger, flushLogs } from './logger.js';
export { prisma, getPrismaClient, disconnectPrisma } from './database.js';
export { MQTT_CONFIG, MQTT_TOPICS, SENSOR_THRESHOLDS } from './mqtt.config.js';
