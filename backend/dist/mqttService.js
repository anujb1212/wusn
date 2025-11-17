import mqtt from 'mqtt';
const MQTT_BROKER = 'mqtt://localhost:1883';
const MQTT_TOPIC_SENSOR = 'wusn/sensor/+/data';
const MQTT_TOPIC_DASHBOARD = 'wusn/dashboard/updates';
let mqttClient = null;
//Initialize MQTT client and connect to broker
export function initMqtt() {
    mqttClient = mqtt.connect(MQTT_BROKER, {
        clientId: `wusn-backend-${Math.random().toString(16).slice(3)}`,
        clean: true,
        reconnectPeriod: 1000,
    });
    mqttClient.on('connect', () => {
        console.log('✅ MQTT Connected to broker');
        mqttClient.subscribe(MQTT_TOPIC_SENSOR, { qos: 1 }, (err) => {
            if (err) {
                console.error('❌ MQTT Subscribe error:', err);
            }
            else {
                console.log(`📡 Subscribed to: ${MQTT_TOPIC_SENSOR}`);
            }
        });
    });
    mqttClient.on('error', (error) => {
        console.error('❌ MQTT Error:', error);
    });
    mqttClient.on('reconnect', () => {
        console.log('🔄 MQTT Reconnecting...');
    });
    mqttClient.on('close', () => {
        console.log('🔌 MQTT Connection closed');
    });
    return mqttClient;
}
//Publish data to dashboard topic
export function publishToDashboard(data) {
    if (mqttClient && mqttClient.connected) {
        mqttClient.publish(MQTT_TOPIC_DASHBOARD, JSON.stringify(data), { qos: 1, retain: false }, (err) => {
            if (err) {
                console.error('❌ MQTT Publish error:', err);
            }
            else {
                console.log('📤 Published to dashboard');
            }
        });
    }
    else {
        console.warn('⚠️ MQTT not connected, skipping publish');
    }
}
//Get MQTT client instance
export function getMqttClient() {
    return mqttClient;
}
//# sourceMappingURL=mqttService.js.map