// src/services/sensor/sensor.service.ts
/**
 * Sensor Service
 */

import { createLogger } from '../../config/logger.js';
import { SensorDataError } from '../../utils/errors.js';
import { SENSOR_THRESHOLDS } from '../../config/mqtt.config.js';
import type { SoilTexture } from '../../utils/constants.js';
import * as sensorRepo from '../../repositories/sensor.repository.js';
import * as fieldRepo from '../../repositories/field.repository.js';
import { convertSMUtoVWC, convertTemperatureToCelsius } from './calibration.service.js';
import type { SensorPayload, ProcessedSensorData } from '../../models/common.types.js';

const logger = createLogger({ service: 'sensor' });

/**
 * Process sensor data
 */
export async function processSensorData(payload: SensorPayload): Promise<ProcessedSensorData> {
    const { nodeId, moisture, temperature } = payload;

    logger.info({ nodeId, moisture, temperature }, 'Processing sensor data');

    validateSensorPayload(payload);

    let fieldConfig = await fieldRepo.getFieldConfigByNodeId(nodeId);

    if (!fieldConfig) {
        fieldConfig = await fieldRepo.createFieldConfig({
            nodeId,
            fieldName: `Field ${nodeId}`,
            soilTexture: 'SANDY_LOAM',
        });

        logger.info({ nodeId }, 'Created default field config');
    }

    // Type assertion - soilTexture from DB is already validated as SoilTexture enum
    const soilTexture = fieldConfig.soilTexture as SoilTexture;
    const soilMoistureVWC = convertSMUtoVWC(moisture, soilTexture);
    const soilTemperature = convertTemperatureToCelsius(temperature);

    logger.debug(
        { nodeId, smu: moisture, vwc: soilMoistureVWC, temp: soilTemperature },
        'Converted values'
    );

    // Fix timestamp handling
    const timestampValue = payload.timestamp ? new Date(payload.timestamp) : new Date();

    const reading = await sensorRepo.createSensorReading({
        nodeId,
        moisture,
        temperature,
        soilMoistureVWC,
        soilTemperature,
        timestamp: timestampValue,
    });

    logger.info({ readingId: reading.id, nodeId }, 'Saved reading');

    return {
        nodeId,
        soilMoistureVWC,
        soilTemperature,
        timestamp: reading.timestamp,
    };
}

/**
 * Validate payload
 */
function validateSensorPayload(payload: SensorPayload): void {
    const { nodeId, moisture, temperature } = payload;

    if (!nodeId || nodeId <= 0) {
        throw new SensorDataError('Invalid nodeId', { nodeId });
    }

    if (
        moisture < SENSOR_THRESHOLDS.MOISTURE.MIN ||
        moisture > SENSOR_THRESHOLDS.MOISTURE.MAX
    ) {
        throw new SensorDataError(`Moisture out of range: ${moisture}`, { moisture });
    }

    if (
        temperature < SENSOR_THRESHOLDS.TEMPERATURE.MIN ||
        temperature > SENSOR_THRESHOLDS.TEMPERATURE.MAX
    ) {
        throw new SensorDataError(`Temperature out of range: ${temperature}`, { temperature });
    }
}

/**
 * Get latest sensor data
 */
export async function getLatestSensorData(nodeId: number): Promise<ProcessedSensorData | null> {
    const reading = await sensorRepo.getLatestReading(nodeId);

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

/**
 * Get average sensor data
 */
export async function getAverageSensorData(nodeId: number, hours: number = 24) {
    return await sensorRepo.getAverageReadings(nodeId, hours);
}
