// src/services/mqtt.service.ts
/**
 * MQTT Service
 */

import mqtt from 'mqtt';
import { z } from 'zod';
import { MQTT_CONFIG, MQTT_TOPICS } from '../config/mqtt.config.js';
import { createLogger } from '../config/logger.js';
import { processSensorData } from './sensor/sensor.service.js';
import type { SensorPayload } from '../models/common.types.js';

const logger = createLogger({ service: 'mqtt' });

let client: mqtt.MqttClient | null = null;

const sensorPayloadSchema = z.object({
    nodeId: z.number().int().positive(),
    moisture: z.number().min(0).max(1023),
    temperature: z.number().min(-10).max(60),
    timestamp: z.string().optional(),
});

export function initializeMQTT(): void {
    if (client) {
        logger.warn('MQTT already initialized');
        return;
    }

    logger.info({ broker: MQTT_CONFIG.brokerUrl }, 'Connecting to MQTT');

    client = mqtt.connect(MQTT_CONFIG.brokerUrl, MQTT_CONFIG.options);

    client.on('connect', () => {
        logger.info('MQTT connected');

        client?.subscribe(MQTT_TOPICS.SENSOR_DATA, { qos: 1 }, (err) => {
            if (err) {
                logger.error({ err }, 'Subscribe failed');
            } else {
                logger.info({ topic: MQTT_TOPICS.SENSOR_DATA }, 'Subscribed');
            }
        });
    });

    client.on('message', async (topic: string, message: Buffer) => {
        try {
            const payload = JSON.parse(message.toString());
            logger.debug({ topic, payload }, 'Message received');

            const validated = sensorPayloadSchema.parse(payload) as SensorPayload;
            await processSensorData(validated);

        } catch (error) {
            if (error instanceof z.ZodError) {
                logger.error({ errors: error.errors, topic }, 'Invalid payload');
            } else {
                logger.error({ err: error, topic }, 'Processing error');
            }
        }
    });

    client.on('error', (err) => logger.error({ err }, 'MQTT error'));
    client.on('reconnect', () => logger.warn('Reconnecting'));
    client.on('close', () => logger.warn('Connection closed'));
}

export function publishMessage(topic: string, payload: object): void {
    if (!client?.connected) {
        logger.error('Cannot publish: not connected');
        return;
    }

    client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
        if (err) logger.error({ err, topic }, 'Publish failed');
    });
}

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
