/**
 * MQTT Service
 *
 * Handles incoming sensor data from gateway via MQTT
 * Each payload includes BOTH soil measurements (from buried sensor)
 * and air measurements (from gateway BME280 or similar)
 */
/**
 * Initialize MQTT connection and subscribe to sensor data topic
 */
export declare function initializeMQTT(): void;
/**
 * Publish message to MQTT topic
 *
 * @param topic - MQTT topic to publish to
 * @param payload - Message payload (will be JSON stringified)
 */
export declare function publishMessage(topic: string, payload: object): void;
/**
 * Check if MQTT client is connected
 */
export declare function isConnected(): boolean;
/**
 * Disconnect MQTT client gracefully
 */
export declare function disconnectMQTT(): Promise<void>;
//# sourceMappingURL=mqtt.service.d.ts.map