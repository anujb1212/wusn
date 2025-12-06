import mqtt from 'mqtt';
/**
 * Initialize MQTT client and connect to broker
 */
export declare function initMqtt(): mqtt.MqttClient;
/**
 * Publish data to dashboard topic
 */
export declare function publishToDashboard(data: any): void;
/**
 * Get MQTT client instance
 */
export declare function getMqttClient(): mqtt.MqttClient | null;
/**
 * Gracefully disconnect MQTT client
 */
export declare function disconnectMqtt(): Promise<void>;
/**
 * Publish sensor alert to MQTT (for critical conditions)
 */
export declare function publishAlert(nodeId: number, alertType: string, message: string): void;
//# sourceMappingURL=mqttService.d.ts.map