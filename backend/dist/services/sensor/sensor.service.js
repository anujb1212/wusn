/**
 * Sensor Data Processing Service
 *
 * Handles incoming sensor payloads from MQTT gateway
 * Performs calibration and stores data in database
 */
import { createLogger } from '../../config/logger.js';
import { createSensorReading } from '../../repositories/sensor.repository.js';
import { getFieldByNodeId, createField } from '../../repositories/field.repository.js';
import { convertToVWC } from './calibration.service.js';
import { ValidationError } from '../../utils/errors.js';
import { getLatestReading, getAverageSoilReadings, getAverageAirReadings } from '../../repositories/sensor.repository.js';
const logger = createLogger({ service: 'sensor' });
/**
 * Process incoming sensor data from gateway
 *
 * Performs:
 * 1. Field lookup/creation
 * 2. Soil moisture calibration (raw → VWC%)
 * 3. Temperature validation
 * 4. Data storage
 *
 * @param payload - Validated sensor payload from MQTT
 * @returns Processed sensor data
 */
export async function processSensorData(payload) {
    try {
        logger.info({ nodeId: payload.nodeId }, 'Processing sensor data');
        const timestamp = new Date();
        // Get or create field configuration
        let field;
        try {
            field = await getFieldByNodeId(payload.nodeId);
        }
        catch (error) {
            // Field doesn't exist, create with defaults (Lucknow campus location)
            logger.warn({ nodeId: payload.nodeId }, 'Field not found, creating default config');
            field = await createField({
                nodeId: payload.nodeId,
                gatewayId: `gateway-${payload.nodeId}`,
                fieldName: `Field ${payload.nodeId}`,
                latitude: 26.8467, // Lucknow, UP
                longitude: 80.9462,
                soilTexture: 'SANDY_LOAM', // Default for Lucknow campus
            });
        }
        // Calibrate soil moisture: raw sensor value → VWC%
        const soilMoistureVWC = convertToVWC(payload.soilMoisture, field.soilTexture);
        // Soil temperature is already in °C from gateway, just validate
        const soilTemperature = payload.soilTemperature;
        // Validate calibrated/converted values
        if (soilMoistureVWC < 0 || soilMoistureVWC > 100) {
            throw new ValidationError(`Invalid VWC value: ${soilMoistureVWC}% (raw: ${payload.soilMoisture})`);
        }
        if (soilTemperature < -10 || soilTemperature > 60) {
            throw new ValidationError(`Invalid soil temperature: ${soilTemperature}°C`);
        }
        // Validate air measurements
        if (payload.airTemperature < -20 || payload.airTemperature > 60) {
            throw new ValidationError(`Invalid air temperature: ${payload.airTemperature}°C`);
        }
        if (payload.airHumidity < 0 || payload.airHumidity > 100) {
            throw new ValidationError(`Invalid air humidity: ${payload.airHumidity}%`);
        }
        // Store in database with all measurements (type-safe, no 'any')
        const readingData = {
            nodeId: payload.nodeId,
            moisture: payload.soilMoisture,
            temperature: Math.round(payload.soilTemperature * 10),
            soilMoistureVWC,
            soilTemperature,
            airTemperature: payload.airTemperature,
            airHumidity: payload.airHumidity,
            timestamp,
            ...(payload.airPressure !== undefined && { airPressure: payload.airPressure }),
        };
        await createSensorReading(readingData);
        logger.info({
            nodeId: payload.nodeId,
            soilVWC: soilMoistureVWC.toFixed(1),
            soilTemp: soilTemperature.toFixed(1),
            airTemp: payload.airTemperature.toFixed(1),
        }, 'Sensor data processed and stored');
        return {
            nodeId: payload.nodeId,
            soilMoistureVWC,
            soilTemperature,
            airTemperature: payload.airTemperature,
            airHumidity: payload.airHumidity,
            airPressure: payload.airPressure ?? null,
            timestamp,
        };
    }
    catch (error) {
        logger.error({ error, payload }, 'Failed to process sensor data');
        throw error;
    }
}
/**
 * Get latest sensor data for a node
 * Includes both soil and air measurements
 *
 * @param nodeId - Sensor node ID
 * @returns Latest reading or null
 */
export async function getLatestSensorData(nodeId) {
    try {
        const reading = await getLatestReading(nodeId);
        if (!reading || reading.soilMoistureVWC === null || reading.soilTemperature === null) {
            return null;
        }
        return {
            nodeId: reading.nodeId,
            soilMoistureVWC: reading.soilMoistureVWC,
            soilTemperature: reading.soilTemperature,
            airTemperature: reading.airTemperature,
            airHumidity: reading.airHumidity,
            airPressure: reading.airPressure,
            timestamp: reading.timestamp,
        };
    }
    catch (error) {
        logger.error({ error, nodeId }, 'Failed to get latest sensor data');
        throw error;
    }
}
/**
 * Get average soil measurements over time period
 *
 * @param nodeId - Sensor node ID
 * @param hours - Time window in hours (default 24)
 * @returns Average soil data or null
 */
export async function getAverageSoilData(nodeId, hours = 24) {
    try {
        const averages = await getAverageSoilReadings(nodeId, hours);
        if (!averages) {
            return null;
        }
        return {
            nodeId,
            avgSoilMoistureVWC: averages.avgSoilMoistureVWC,
            avgSoilTemperature: averages.avgSoilTemperature,
            readingsCount: averages.readingsCount,
            hours,
        };
    }
    catch (error) {
        logger.error({ error, nodeId, hours }, 'Failed to get average soil data');
        throw error;
    }
}
/**
 * Get average air measurements over time period
 *
 * @param nodeId - Sensor node ID
 * @param hours - Time window in hours (default 24)
 * @returns Average air data or null
 */
export async function getAverageAirData(nodeId, hours = 24) {
    try {
        const averages = await getAverageAirReadings(nodeId, hours);
        if (!averages) {
            return null;
        }
        return {
            nodeId,
            avgAirTemperature: averages.avgAirTemperature,
            avgAirHumidity: averages.avgAirHumidity,
            avgAirPressure: averages.avgAirPressure,
            readingsCount: averages.readingsCount,
            hours,
        };
    }
    catch (error) {
        logger.error({ error, nodeId, hours }, 'Failed to get average air data');
        throw error;
    }
}
//# sourceMappingURL=sensor.service.js.map