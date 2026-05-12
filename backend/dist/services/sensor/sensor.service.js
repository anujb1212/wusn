/**
 * Sensor Data Processing Service
 *
 * Handles incoming sensor payloads from MQTT gateway
 * Performs calibration and stores data in database
 */
import { prisma } from '../../config/database.js';
import { createLogger } from '../../config/logger.js';
import { createField, getFieldByNodeId } from '../../repositories/field.repository.js';
import { createSensorReading, getAverageAirReadings, getAverageSoilReadings, getLatestReading } from '../../repositories/sensor.repository.js';
import { ValidationError } from '../../utils/errors.js';
import { calculateDailyGDD } from '../gdd/gdd.service.js';
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
        if (!payload.nodeId || payload.nodeId <= 0) {
            throw new ValidationError(`Invalid nodeId: ${payload.nodeId}. Payload rejected.`);
        }
        const timestamp = new Date();
        // Get or create field configuration
        let field;
        try {
            field = await getFieldByNodeId(payload.nodeId);
        }
        catch (error) {
            logger.warn({ nodeId: payload.nodeId }, 'Field not found, creating default config');
            // Upsert Node first (Field has FK → Node.nodeId)
            await prisma.node.upsert({
                where: { nodeId: payload.nodeId },
                create: { nodeId: payload.nodeId, isActive: true },
                update: { lastSeen: new Date() },
            });
            field = await createField({
                gatewayId: `gateway-${payload.nodeId}`,
                fieldName: `Field ${payload.nodeId}`,
                latitude: 26.8467,
                longitude: 80.9462,
                soilTexture: 'SANDY_LOAM',
            });
        }
        // Calibrate soil moisture: raw sensor value → VWC%
        const soilMoistureVWC = payload.soilMoistureVWC;
        // Soil temperature is already in °C from gateway, just validate
        const soilTemperature = payload.soilTemperature;
        // Validate calibrated/converted values
        if (soilMoistureVWC < 0 || soilMoistureVWC > 100) {
            throw new ValidationError(`Invalid VWC value: ${soilMoistureVWC}%`);
        }
        if (soilMoistureVWC === 0 && soilTemperature === 0) {
            throw new ValidationError(`Sensor zero readings for nodeId=${payload.nodeId}. ` +
                `Raw moisture=${payload.soilMoistureVWC}, temp=${payload.soilTemperature}. ` +
                `Check node/gateway connection.`);
        }
        if (soilTemperature < -10 || soilTemperature > 60) {
            throw new ValidationError(`Invalid soil temperature: ${soilTemperature}°C`);
        }
        // Validate air measurements
        if (payload.airTemperature < -20 || payload.airTemperature > 60) {
            throw new ValidationError(`Invalid air temperature: ${payload.airTemperature}°C`);
        }
        const airHumidity = payload.airHumidity ?? 0;
        if (airHumidity < 0 || airHumidity > 100) {
            throw new ValidationError(`Invalid air humidity: ${airHumidity}%`);
        }
        // Store in database with all measurements (type-safe, no 'any')
        const readingData = {
            nodeId: payload.nodeId,
            moisture: Math.round(soilMoistureVWC * 10),
            temperature: Math.round(payload.soilTemperature * 10),
            soilMoistureVWC,
            soilTemperature,
            airTemperature: payload.airTemperature,
            airHumidity: payload.airHumidity ?? 0,
            timestamp,
            ...(payload.airPressure !== undefined && { airPressure: payload.airPressure }),
        };
        await createSensorReading(readingData);
        // Fire-and-forget GDD trigger — must never block sensor storage
        const todayDate = timestamp.toISOString().slice(0, 10); // 'YYYY-MM-DD' — always string
        calculateDailyGDD(payload.nodeId, new Date(todayDate)).catch((gddErr) => {
            logger.warn({ nodeId: payload.nodeId, date: todayDate, err: gddErr }, 'GDD trigger failed (non-fatal)');
        });
        _triggerAggregation(payload.nodeId, timestamp).catch((aggErr) => {
            logger.warn({ nodeId: payload.nodeId, err: aggErr }, 'Aggregation trigger failed (non-fatal)');
        });
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
            airHumidity: airHumidity,
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
async function _triggerAggregation(triggerNodeId, timestamp) {
    // 1. All active nodes
    const nodes = await prisma.node.findMany({
        where: { isActive: true },
        select: { nodeId: true },
    });
    if (nodes.length === 0)
        return;
    const staleThreshold = new Date(Date.now() - 10 * 60 * 1000);
    const snapshots = [];
    let bestNodeId = triggerNodeId;
    let bestScore = -1;
    const readings = await Promise.all(nodes.map(n => getLatestReading(n.nodeId)));
    for (let i = 0; i < nodes.length; i++) {
        const latest = readings[i];
        const n = nodes[i];
        if (!latest)
            continue;
        const isStale = latest.timestamp < staleThreshold;
        const score = isStale ? 0 : _computeNodeScore(latest);
        snapshots.push({
            nodeId: n.nodeId,
            soilMoistureVWC: latest.soilMoistureVWC,
            soilTemperature: latest.soilTemperature,
            airTemperature: latest.airTemperature,
            timestamp: latest.timestamp.toISOString(),
            isStale,
            selectionScore: score,
        });
        if (!isStale && score > bestScore) {
            bestScore = score;
            bestNodeId = n.nodeId;
        }
    }
    if (snapshots.length === 0)
        return;
    await prisma.aggregatedReading.create({
        data: {
            timestamp,
            selectedNodeId: bestNodeId,
            selectionScore: bestScore,
            selectionReason: `Node ${bestNodeId} selected — highest reliability score ` +
                `(${bestScore.toFixed(1)}) among ${snapshots.length} active node(s).`,
            allNodesData: snapshots,
        },
    });
    logger.info({ selectedNodeId: bestNodeId, totalNodes: snapshots.length, score: bestScore }, 'Aggregation snapshot written');
}
function _computeNodeScore(reading) {
    const vwc = reading.soilMoistureVWC;
    if (vwc <= 0 || vwc > 90)
        return 0;
    const vwcScore = Math.max(0, 100 - Math.abs(vwc - 25) * 2);
    const tempScore = reading.soilTemperature >= 10 && reading.soilTemperature <= 45
        ? 100
        : 50;
    return vwcScore * 0.7 + tempScore * 0.3;
}
//# sourceMappingURL=sensor.service.js.map