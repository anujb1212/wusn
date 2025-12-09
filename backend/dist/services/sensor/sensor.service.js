// src/services/sensor/sensor.service.ts
import { createLogger } from '../../config/logger.js';
import { createSensorReading } from '../../repositories/sensor.repository.js';
import { getFieldByNodeId, createField } from '../../repositories/field.repository.js';
import { convertToVWC, convertToTemperature } from './calibration.service.js';
import { ValidationError } from '../../utils/errors.js';
import { getLatestReading, getAverageReadings } from '../../repositories/sensor.repository.js';
const logger = createLogger({ service: 'sensor' });
/**
 * Process incoming sensor data
 */
export async function processSensorData(payload) {
    try {
        logger.info({ nodeId: payload.nodeId }, 'Processing sensor data');
        const timestamp = payload.timestamp ? new Date(payload.timestamp) : new Date();
        // Get or create field configuration
        let field;
        try {
            field = await getFieldByNodeId(payload.nodeId);
        }
        catch (error) {
            // Field doesn't exist, create with defaults
            logger.warn({ nodeId: payload.nodeId }, 'Field not found, creating default config');
            field = await createField({
                nodeId: payload.nodeId,
                gatewayId: `gateway-${payload.nodeId}`,
                fieldName: `Field ${payload.nodeId}`,
                latitude: 26.8467,
                longitude: 80.9462,
                soilTexture: 'SANDY_LOAM',
            });
        }
        // Convert raw values using calibration - type assertion for soilTexture
        const vwc = convertToVWC(payload.moisture, field.soilTexture);
        const temp = convertToTemperature(payload.temperature);
        // Validate converted values
        if (vwc < 0 || vwc > 100) {
            throw new ValidationError(`Invalid VWC value: ${vwc} (raw: ${payload.moisture})`);
        }
        if (temp < -10 || temp > 60) {
            throw new ValidationError(`Invalid temperature value: ${temp} (raw: ${payload.temperature})`);
        }
        // Store in database
        await createSensorReading({
            nodeId: payload.nodeId,
            moisture: payload.moisture,
            temperature: payload.temperature,
            soilMoistureVWC: vwc,
            soilTemperature: temp,
            timestamp,
        });
        logger.info({ nodeId: payload.nodeId, vwc, temp }, 'Sensor data processed successfully');
        return {
            nodeId: payload.nodeId,
            soilMoistureVWC: vwc,
            soilTemperature: temp,
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
            timestamp: reading.timestamp,
        };
    }
    catch (error) {
        logger.error({ error, nodeId }, 'Failed to get latest sensor data');
        throw error;
    }
}
/**
 * Get average sensor data for a node over time period
 */
export async function getAverageSensorData(nodeId, hours = 24) {
    try {
        const averages = await getAverageReadings(nodeId, hours);
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
        logger.error({ error, nodeId, hours }, 'Failed to get average sensor data');
        throw error;
    }
}
//# sourceMappingURL=sensor.service.js.map