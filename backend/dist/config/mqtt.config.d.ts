/**
 * MQTT Configuration
 * Underground nodes send ONLY: moisture + temperature
 */
import "dotenv/config";
export declare const MQTT_TOPICS: {
    readonly SENSOR_DATA: "wusn/sensor/+/data";
    readonly DASHBOARD_UPDATES: "wusn/dashboard/updates";
    readonly ALERTS: "wusn/alerts/#";
};
export declare const MQTT_CONFIG: {
    readonly brokerUrl: string;
    readonly clientId: string;
    readonly options: {
        readonly will: {
            readonly topic: "wusn/backend/status";
            readonly payload: Buffer<ArrayBuffer>;
            readonly qos: 0 | 1 | 2;
            readonly retain: true;
        };
        readonly rejectUnauthorized?: boolean;
        readonly password?: string;
        readonly username?: string;
        readonly clean: true;
        readonly reconnectPeriod: 1000;
        readonly connectTimeout: 30000;
        readonly keepalive: 60;
        readonly qos: 0 | 1 | 2;
    };
};
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