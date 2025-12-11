/**
 * MQTT Service
 *
 * Handles incoming sensor data from gateway via MQTT
 * Each payload includes BOTH soil measurements (from buried sensor)
 * and air measurements (from gateway BME280 or similar)
 */
import mqtt from 'mqtt';
import { z } from 'zod';
import { MQTT_CONFIG, MQTT_TOPICS } from '../config/mqtt.config.js';
import { createLogger } from '../config/logger.js';
import { processSensorData } from './sensor/sensor.service.js';
const logger = createLogger({ service: 'mqtt' });
let client = null;
/**
 * Validation schema for sensor payload
 *
 * Gateway sends combined payload with:
 * - Soil measurements: soilMoisture, soilTemperature (from buried sensor)
 * - Air measurements: airTemperature, airHumidity, airPressure (from gateway BME280)
 */
const sensorPayloadSchema = z.object({
    nodeId: z.number().int().positive(),
    // Soil measurements (from buried sensor node)
    soilMoisture: z.number().min(0).max(1023), // Raw sensor value (0-1023)
    soilTemperature: z.number().min(-20).max(60), // Soil temp in °C
    // Air measurements (from gateway sensor)
    airTemperature: z.number().min(-20).max(60), // Air temp in °C (critical for GDD)
    airHumidity: z.number().min(0).max(100), // Relative humidity %
    airPressure: z.number().min(800).max(1100).optional(), // Barometric pressure (hPa)
});
/**
 * Initialize MQTT connection and subscribe to sensor data topic
 */
export function initializeMQTT() {
    if (client) {
        logger.warn('MQTT already initialized');
        return;
    }
    logger.info({ broker: MQTT_CONFIG.brokerUrl }, 'Connecting to MQTT broker');
    client = mqtt.connect(MQTT_CONFIG.brokerUrl, MQTT_CONFIG.options);
    client.on('connect', () => {
        logger.info('MQTT connected successfully');
        // Subscribe to sensor data topic
        client?.subscribe(MQTT_TOPICS.SENSOR_DATA, { qos: 1 }, (err) => {
            if (err) {
                logger.error({ err, topic: MQTT_TOPICS.SENSOR_DATA }, 'Failed to subscribe to sensor topic');
            }
            else {
                logger.info({ topic: MQTT_TOPICS.SENSOR_DATA }, 'Subscribed to sensor data topic');
            }
        });
    });
    client.on('message', async (topic, message) => {
        try {
            const payload = JSON.parse(message.toString());
            logger.debug({ topic, payload }, 'MQTT message received');
            // Validate and process sensor data
            if (topic.startsWith('wusn/sensor/') && topic.endsWith('/data')) {
                const validated = sensorPayloadSchema.parse(payload);
                await processSensorData(validated);
                logger.info({
                    nodeId: validated.nodeId,
                    soilTemp: validated.soilTemperature,
                    airTemp: validated.airTemperature,
                    soilMoisture: validated.soilMoisture,
                }, 'Sensor data processed');
            }
            else {
                logger.warn({ topic }, 'Unknown topic pattern');
            }
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                logger.error({
                    errors: error.errors,
                    topic,
                }, 'Invalid payload - validation failed');
            }
            else {
                logger.error({ err: error, topic }, 'Failed to process MQTT message');
            }
        }
    });
    client.on('error', (err) => {
        logger.error({ err }, 'MQTT client error');
    });
    client.on('reconnect', () => {
        logger.warn('Reconnecting to MQTT broker');
    });
    client.on('close', () => {
        logger.warn('MQTT connection closed');
    });
}
/**
 * Publish message to MQTT topic
 *
 * @param topic - MQTT topic to publish to
 * @param payload - Message payload (will be JSON stringified)
 */
export function publishMessage(topic, payload) {
    if (!client?.connected) {
        logger.error({ topic }, 'Cannot publish: MQTT not connected');
        return;
    }
    client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
        if (err) {
            logger.error({ err, topic }, 'Failed to publish message');
        }
        else {
            logger.debug({ topic }, 'Message published');
        }
    });
}
/**
 * Check if MQTT client is connected
 */
export function isConnected() {
    return client?.connected ?? false;
}
/**
 * Disconnect MQTT client gracefully
 */
export async function disconnectMQTT() {
    return new Promise((resolve) => {
        if (client) {
            client.end(false, () => {
                logger.info('MQTT disconnected');
                client = null;
                resolve();
            });
        }
        else {
            resolve();
        }
    });
}
//# sourceMappingURL=mqtt.service.js.map