// src/config/mqtt.config.ts
/**
 * MQTT Configuration
 * Underground nodes send ONLY: moisture + temperature
 */
import { env } from './environment.js';
/**
 * MQTT Topics
 */
export const MQTT_TOPICS = {
    SENSOR_DATA: 'wusn/sensor/+/data',
    DASHBOARD_UPDATES: 'wusn/dashboard/updates',
    ALERTS: 'wusn/alerts/#',
};
/**
 * MQTT Connection Config
 */
export const MQTT_CONFIG = {
    brokerUrl: `mqtt://${env.MQTT_BROKER_HOST}:${env.MQTT_BROKER_PORT}`,
    clientId: env.MQTT_CLIENT_ID || `wusn-backend-${Math.random().toString(16).slice(2, 10)}`,
    options: {
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30000,
        keepalive: 60,
        qos: 1,
        will: {
            topic: 'wusn/backend/status',
            payload: Buffer.from(JSON.stringify({
                status: 'offline',
                timestamp: new Date().toISOString()
            })),
            qos: 1,
            retain: true,
        },
    },
};
/**
 * Sensor validation thresholds
 * ONLY moisture and temperature
 */
export const SENSOR_THRESHOLDS = {
    MOISTURE: {
        MIN: 0,
        MAX: 1023,
    },
    TEMPERATURE: {
        MIN: -10,
        MAX: 60,
    },
};
//# sourceMappingURL=mqtt.config.js.map