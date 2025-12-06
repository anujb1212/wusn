import mqtt from 'mqtt';
import { PrismaClient } from '@prisma/client';
import { calculateDailyGDDFromSoilTemp } from './gddService.js';

const prisma = new PrismaClient();

const MQTT_HOST = process.env.MQTT_BROKER_HOST || '127.0.0.1';
const MQTT_PORT = Number(process.env.MQTT_BROKER_PORT || 1883);

const MQTT_BROKER = `mqtt://${MQTT_HOST}:${MQTT_PORT}`;
const MQTT_TOPIC_SENSOR = 'wusn/sensor/+/data';
const MQTT_TOPIC_DASHBOARD = 'wusn/dashboard/updates';

let mqttClient: mqtt.MqttClient | null = null;

interface SensorPayload {
    nodeId: number;
    moisture: number; // SMU value 0-1023
    temperature: number; // Raw temperature (might need conversion)
    rssi?: number;
    batteryLevel?: number;
    timestamp?: string;
}

/**
 * Convert SMU (0-1023) to VWC percentage
 * Calibration for sandy loam soil in UP conditions
 * 
 * Formula: VWC = (SMU - 200) / 800 × 60 + 15
 * 
 * This gives a range of ~15% to 75% VWC which is realistic for sandy loam:
 * - Wilting point: ~8-10% VWC
 * - Field capacity: ~35-45% VWC
 * - Saturation: ~45-50% VWC
 * 
 * Adjust these constants based on your sensor calibration tests!
 */
function convertSMUtoVWC(smu: number): number {
    // Clamp SMU to valid range
    const clampedSMU = Math.max(0, Math.min(1023, smu));

    // Linear conversion calibrated for sandy loam soil
    // You may need to adjust these values based on field calibration
    const SMU_MIN = 200; // SMU at air-dry soil (~15% VWC)
    const SMU_MAX = 1000; // SMU at saturated soil (~75% VWC)
    const VWC_MIN = 15; // Minimum VWC in %
    const VWC_MAX = 75; // Maximum VWC in %

    const vwc =
        ((clampedSMU - SMU_MIN) / (SMU_MAX - SMU_MIN)) * (VWC_MAX - VWC_MIN) +
        VWC_MIN;

    // Clamp to realistic VWC range for sandy loam
    const clampedVWC = Math.max(0, Math.min(80, vwc));

    return Math.round(clampedVWC * 100) / 100; // Round to 2 decimals
}

/**
 * Convert raw temperature to Celsius (if needed)
 * Adjust this function based on your sensor's output format
 */
function convertTemperatureToCelsius(rawTemp: number): number {
    // If your sensor already sends Celsius, just return it
    // If it sends raw ADC values, convert here
    // Example: Some sensors send temp * 10 (e.g., 235 = 23.5°C)

    // Assuming sensor already sends Celsius:
    return Math.round(rawTemp * 100) / 100; // Round to 2 decimals
}

/**
 * Process incoming MQTT sensor data
 * - Validates sensor readings
 * - Converts SMU to VWC
 * - Stores in database
 * - Triggers GDD calculation when needed
 */
async function handleSensorData(payload: SensorPayload): Promise<void> {
    try {
        const { nodeId, moisture, temperature, rssi, batteryLevel } = payload;

        console.log(
            `[MQTT] 📥 Received from Node ${nodeId}: ` +
            `SMU=${moisture}, Temp=${temperature}°C, RSSI=${rssi || 'N/A'}`
        );

        // ========================================
        // VALIDATION
        // ========================================

        if (!nodeId || nodeId <= 0) {
            console.error(`[MQTT] ❌ Invalid nodeId: ${nodeId}`);
            return;
        }

        if (moisture < 0 || moisture > 1023) {
            console.error(`[MQTT] ❌ Invalid soil moisture value: ${moisture}`);
            return;
        }

        if (temperature < -10 || temperature > 60) {
            console.error(`[MQTT] ❌ Invalid temperature: ${temperature}°C`);
            return;
        }

        // ========================================
        // CONVERT VALUES
        // ========================================

        const soilMoistureVWC = convertSMUtoVWC(moisture);
        const soilTemperature = convertTemperatureToCelsius(temperature);

        console.log(
            `[MQTT] 🔄 Converted: SMU ${moisture} → ${soilMoistureVWC.toFixed(2)}% VWC, ` +
            `Temp → ${soilTemperature.toFixed(2)}°C`
        );

        // ========================================
        // CHECK IF NODE EXISTS
        // ========================================

        let node = await prisma.node.findUnique({
            where: { nodeId },
        });

        if (!node) {
            console.log(`[MQTT] 🆕 New node detected: ${nodeId}. Creating...`);
            node = await prisma.node.create({
                data: {
                    nodeId,
                    lastSeen: new Date(),
                    isActive: true,
                },
            });
            console.log(`[MQTT] ✅ Node ${nodeId} created`);
        } else {
            // Update last seen timestamp
            await prisma.node.update({
                where: { nodeId },
                data: { lastSeen: new Date() },
            });
        }

        // ========================================
        // STORE SENSOR READING
        // ========================================

        const reading = await prisma.sensorReading.create({
            data: {
                nodeId,
                moisture, // Raw SMU value
                temperature, // Raw temperature value
                soilMoistureVWC, // Calculated VWC percentage
                soilTemperature, // Converted temperature in Celsius
                rssi: rssi || null,
                batteryLevel: batteryLevel || null,
                timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
            },
        });

        console.log(
            `[MQTT] ✅ Stored reading ID ${reading.id}: ` +
            `VWC=${soilMoistureVWC.toFixed(2)}%, Temp=${soilTemperature.toFixed(2)}°C`
        );

        // ========================================
        // TRIGGER GDD CALCULATION (IF NEEDED)
        // ========================================

        // Check if we should calculate GDD for yesterday
        // We calculate at the end of each day when first reading of new day arrives
        await checkAndCalculateGDD(nodeId);

        // ========================================
        // PUBLISH TO DASHBOARD
        // ========================================

        publishToDashboard({
            type: 'sensor_update',
            nodeId,
            data: {
                moisture: soilMoistureVWC, // Send VWC to dashboard
                temperature: soilTemperature,
                rssi: rssi || null,
                batteryLevel: batteryLevel || null,
                timestamp: reading.timestamp,
            },
        });
    } catch (error) {
        console.error(`[MQTT] ❌ Error handling sensor data:`, error);
    }
}

/**
 * Check if we need to calculate GDD for yesterday
 * Triggers calculation when first reading of new day arrives
 */
async function checkAndCalculateGDD(nodeId: number): Promise<void> {
    try {
        // Get field configuration
        const fieldConfig = await prisma.fieldConfig.findUnique({
            where: { nodeId },
        });

        // Skip if no crop is configured or no sowing date
        if (!fieldConfig || !fieldConfig.sowingDate || !fieldConfig.cropType) {
            return;
        }

        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        const yesterdayStart = new Date(yesterday);
        yesterdayStart.setHours(0, 0, 0, 0);

        // Check if GDD has already been calculated for yesterday
        const existingGDD = await prisma.gDDHistory.findUnique({
            where: {
                nodeId_date: {
                    nodeId,
                    date: yesterdayStart,
                },
            },
        });

        if (existingGDD) {
            // Already calculated, skip
            return;
        }

        // Check if yesterday is after sowing date
        const sowingDateStart = new Date(fieldConfig.sowingDate);
        sowingDateStart.setHours(0, 0, 0, 0);

        if (yesterdayStart < sowingDateStart) {
            // Yesterday was before sowing, skip
            return;
        }

        console.log(
            `[MQTT] 🌱 Triggering GDD calculation for yesterday (${yesterdayStart.toISOString().split('T')[0]})`
        );

        // Run GDD calculation asynchronously (don't block MQTT processing)
        calculateDailyGDDFromSoilTemp(nodeId, yesterdayStart).catch((err: any) => {
            console.error(`[MQTT] ❌ GDD calculation failed:`, err);
        });
    } catch (error) {
        console.error(`[MQTT] ❌ Error checking GDD:`, error);
    }
}


/**
 * Initialize MQTT client and connect to broker
 */
export function initMqtt(): mqtt.MqttClient {
    console.log(`[MQTT] 🔌 Connecting to broker at ${MQTT_BROKER}`);

    mqttClient = mqtt.connect(MQTT_BROKER, {
        clientId: `wusn-backend-${Math.random().toString(16).slice(3)}`,
        clean: true,
        reconnectPeriod: 1000,
    });

    mqttClient.on('connect', () => {
        console.log('[MQTT] ✅ Connected to broker');

        mqttClient!.subscribe(MQTT_TOPIC_SENSOR, { qos: 1 }, (err) => {
            if (err) {
                console.error('[MQTT] ❌ Subscribe error:', err);
            } else {
                console.log(`[MQTT] 📡 Subscribed to: ${MQTT_TOPIC_SENSOR}`);
            }
        });
    });

    mqttClient.on('message', async (topic, message) => {
        try {
            console.log(`[MQTT] 📨 Message on topic: ${topic}`);

            // Parse sensor data payload
            const payload: SensorPayload = JSON.parse(message.toString());

            // Process sensor data
            await handleSensorData(payload);
        } catch (error) {
            console.error('[MQTT] ❌ Message parsing/processing error:', error);
            console.error('[MQTT] Raw message:', message.toString());
        }
    });

    mqttClient.on('error', (error) => {
        console.error('[MQTT] ❌ Connection error:', error);
    });

    mqttClient.on('reconnect', () => {
        console.log('[MQTT] 🔄 Reconnecting...');
    });

    mqttClient.on('close', () => {
        console.log('[MQTT] 🔌 Connection closed');
    });

    mqttClient.on('offline', () => {
        console.log('[MQTT] ⚠️ Client offline');
    });

    return mqttClient;
}

/**
 * Publish data to dashboard topic
 */
export function publishToDashboard(data: any): void {
    if (mqttClient && mqttClient.connected) {
        mqttClient.publish(
            MQTT_TOPIC_DASHBOARD,
            JSON.stringify(data),
            { qos: 1, retain: false },
            (err) => {
                if (err) {
                    console.error('[MQTT] ❌ Publish error:', err);
                } else {
                    console.log('[MQTT] 📤 Published to dashboard');
                }
            }
        );
    } else {
        console.warn('[MQTT] ⚠️ Not connected, skipping publish');
    }
}

/**
 * Get MQTT client instance
 */
export function getMqttClient(): mqtt.MqttClient | null {
    return mqttClient;
}

/**
 * Gracefully disconnect MQTT client
 */
export async function disconnectMqtt(): Promise<void> {
    return new Promise((resolve) => {
        if (mqttClient) {
            mqttClient.end(false, {}, () => {
                console.log('[MQTT] 👋 Disconnected');
                resolve();
            });
        } else {
            resolve();
        }
    });
}

/**
 * Publish sensor alert to MQTT (for critical conditions)
 */
export function publishAlert(nodeId: number, alertType: string, message: string): void {
    if (mqttClient && mqttClient.connected) {
        const alertData = {
            type: 'alert',
            nodeId,
            alertType,
            message,
            timestamp: new Date().toISOString(),
        };

        mqttClient.publish(
            `wusn/alerts/${nodeId}`,
            JSON.stringify(alertData),
            { qos: 2, retain: true }, // QoS 2 for critical alerts
            (err) => {
                if (err) {
                    console.error('[MQTT] ❌ Alert publish error:', err);
                } else {
                    console.log(`[MQTT] 🚨 Alert published for node ${nodeId}`);
                }
            }
        );
    }
}
