/**
 * MQTT Service - Enhanced for weather data
 */

import mqtt from 'mqtt';
import { z } from 'zod';
import { MQTT_CONFIG, MQTT_TOPICS } from '../config/mqtt.config.js';
import { createLogger } from '../config/logger.js';
import { processSensorData } from './sensor/sensor.service.js';
import { createWeatherReading } from '../repositories/weather.repository.js';
import type { SensorPayload, WeatherPayload } from '../models/common.types.js';

const logger = createLogger({ service: 'mqtt' });

let client: mqtt.MqttClient | null = null;

// Validation schemas
const sensorPayloadSchema = z.object({
    nodeId: z.number().int().positive(),
    moisture: z.number().min(0).max(1023),
    temperature: z.number().min(-10).max(60),
    timestamp: z.string().optional(),
});

const weatherPayloadSchema = z.object({
    gatewayId: z.string().min(1),
    airTemperature: z.number().min(-20).max(60),
    humidity: z.number().min(0).max(100),
    pressure: z.number().positive().optional(),
    timestamp: z.string().optional(),
});

/**
 * Process weather data from gateway
 */
async function processWeatherData(payload: WeatherPayload): Promise<void> {
    try {
        const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();

        await createWeatherReading({
            gatewayId: payload.gatewayId,
            airTemperature: payload.airTemperature,
            humidity: payload.humidity,
            pressure: payload.pressure,
            timestamp,
        });

        logger.info(
            { gatewayId: payload.gatewayId, airTemp: payload.airTemperature },
            'Weather data processed'
        );
    } catch (error) {
        logger.error({ error, payload }, 'Failed to process weather data');
        throw error;
    }
}

/**
 * Initialize MQTT connection
 */
export function initializeMQTT(): void {
    if (client) {
        logger.warn('MQTT already initialized');
        return;
    }

    logger.info({ broker: MQTT_CONFIG.brokerUrl }, 'Connecting to MQTT');

    client = mqtt.connect(MQTT_CONFIG.brokerUrl, MQTT_CONFIG.options);

    client.on('connect', () => {
        logger.info('MQTT connected');

        // Subscribe to sensor data topic
        client?.subscribe(MQTT_TOPICS.SENSOR_DATA, { qos: 1 }, (err) => {
            if (err) {
                logger.error({ err }, 'Failed to subscribe to sensor topic');
            } else {
                logger.info({ topic: MQTT_TOPICS.SENSOR_DATA }, 'Subscribed to sensor data');
            }
        });

        // Subscribe to weather data topic
        const weatherTopic = 'wusn/gateway/+/weather';
        client?.subscribe(weatherTopic, { qos: 1 }, (err) => {
            if (err) {
                logger.error({ err }, 'Failed to subscribe to weather topic');
            } else {
                logger.info({ topic: weatherTopic }, 'Subscribed to weather data');
            }
        });
    });

    client.on('message', async (topic: string, message: Buffer) => {
        try {
            const payload = JSON.parse(message.toString());
            logger.debug({ topic, payload }, 'Message received');

            // Route based on topic
            if (topic.startsWith('wusn/sensor/') && topic.endsWith('/data')) {
                // Soil sensor data
                const validated = sensorPayloadSchema.parse(payload) as SensorPayload;
                await processSensorData(validated);
            } else if (topic.includes('/gateway/') && topic.endsWith('/weather')) {
                // Weather data from gateway
                const validated = weatherPayloadSchema.parse(payload) as WeatherPayload;
                await processWeatherData(validated);
            } else {
                logger.warn({ topic }, 'Unknown topic pattern');
            }

        } catch (error) {
            if (error instanceof z.ZodError) {
                logger.error({ errors: error.errors, topic }, 'Invalid payload');
            } else {
                logger.error({ err: error, topic }, 'Processing error');
            }
        }
    });

    client.on('error', (err) => logger.error({ err }, 'MQTT error'));
    client.on('reconnect', () => logger.warn('Reconnecting to MQTT'));
    client.on('close', () => logger.warn('MQTT connection closed'));
}

/**
 * Publish message
 */
export function publishMessage(topic: string, payload: object): void {
    if (!client?.connected) {
        logger.error('Cannot publish: MQTT not connected');
        return;
    }

    client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
        if (err) {
            logger.error({ err, topic }, 'Publish failed');
        } else {
            logger.debug({ topic }, 'Message published');
        }
    });
}

/**
 * Disconnect MQTT
 */
export async function disconnectMQTT(): Promise<void> {
    return new Promise((resolve) => {
        if (client) {
            client.end(false, () => {
                logger.info('MQTT disconnected');
                client = null;
                resolve();
            });
        } else {
            resolve();
        }
    });
}
