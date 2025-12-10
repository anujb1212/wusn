/**
 * MQTT Configuration
 * Underground nodes send ONLY: moisture + temperature
 */
/**
 * MQTT Topics
 */
export declare const MQTT_TOPICS: {
    readonly SENSOR_DATA: "wusn/sensor/+/data";
    readonly DASHBOARD_UPDATES: "wusn/dashboard/updates";
    readonly ALERTS: "wusn/alerts/#";
};
/**
 * MQTT Connection Config
 */
export declare const MQTT_CONFIG: {
    readonly brokerUrl: `mqtt://${string}:${number}`;
    readonly clientId: string;
    readonly options: {
        readonly clean: true;
        readonly reconnectPeriod: 1000;
        readonly connectTimeout: 30000;
        readonly keepalive: 60;
        readonly qos: 0 | 1 | 2;
        readonly will: {
            readonly topic: "wusn/backend/status";
            readonly payload: Buffer<ArrayBuffer>;
            readonly qos: 0 | 1 | 2;
            readonly retain: true;
        };
    };
};
/**
 * Sensor validation thresholds
 * ONLY moisture and temperature
 */
export declare const SENSOR_THRESHOLDS: {
    readonly MOISTURE: {
        readonly MIN: 0;
        readonly MAX: 1023;
    };
    readonly TEMPERATURE: {
        readonly MIN: -10;
        readonly MAX: 60;
    };
};
//# sourceMappingURL=mqtt.config.d.ts.map