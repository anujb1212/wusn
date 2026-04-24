/**
 * MQTT Service
 *
 * Handles incoming sensor data from gateway via MQTT
 * Each payload includes BOTH soil measurements (from buried sensor)
 * and air measurements (from gateway BME280 or similar)
 */
export declare function initializeMQTT(): void;
/**
 * Publish message to MQTT topic
 *
 * @param topic - MQTT topic to publish to
 * @param payload - Message payload (will be JSON stringified)
 */
export declare function publishMessage(topic: string, payload: object): void;
export declare function isConnected(): boolean;
export declare function disconnectMQTT(): Promise<void>;
//# sourceMappingURL=mqtt.service.d.ts.map