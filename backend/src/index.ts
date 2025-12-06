import express from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import { createServer } from 'http';
import { analyzeSoilConditions } from './fuzzyService.js';
import { initMqtt, publishToDashboard, getMqttClient } from './mqttService.js';
import { translateCropName } from './cropTranslations.js';
import { translateIrrigation, translateSummary } from './irrigationTranslations.js';
import { fetchWeatherWithCache } from './weatherService.js';
import {
    calculateDailyGDDFromSoilTemp,
    calculateGDDForDateRange,
    getLatestGDDStatus,
    getGrowthStageInfo,
    getDaysElapsed,
    filterUPCrops,
    UP_VALID_CROPS,
    getCropBaseTemp,
    getCropGDDRequirement,
} from './gddService.js';
import { makeIrrigationDecision, recordIrrigationAction } from './irrigationEngine.js';
import {
    recommendCropsForUP,
    validateNorthIndiaConditions,
} from './cropRecommendationService.js';

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3000;

// ============================================================================
// INTERFACES
// ============================================================================

interface SensorPayload {
    nodeId: number;
    moisture: number;
    temperature: number;
    rssi?: number;
    batteryLevel?: number;
}

interface AggregatedPayload {
    timestamp: string;
    nodes: Array<{
        nodeId: number;
        moisture: number;
        temperature: number;
        rssi: number;
        batteryLevel: number;
        depth: number;
        distance: number;
    }>;
}

// ============================================================================
// MQTT INITIALIZATION
// ============================================================================

console.log('🚀 Initializing MQTT...');
const mqttClient = initMqtt();

console.log('⏳ Waiting for MQTT connection...');

// ============================================================================
// LEGACY PROCESSING (Updated to save VWC)
// ============================================================================

/**
 * LEGACY: Old processing function (uses old moisture format)
 * NOW ALSO SAVES VWC for new services
 */
async function processSensorDataLegacy(payload: SensorPayload) {
    const { nodeId, moisture, temperature, rssi } = payload;

    console.log(`\n🔄 [LEGACY] Processing sensor data for Node ${nodeId}...`);

    // Update node
    await prisma.node.upsert({
        where: { nodeId },
        update: { lastSeen: new Date(), isActive: true },
        create: {
            nodeId,
            location: `Node ${nodeId}`,
            burialDepth: 40,
            isActive: true,
        },
    });

    // ✅ CONVERT SMU to VWC (moisture / 10)
    const soilMoistureVWC = moisture / 10;
    const soilTemperature = temperature; // Use air temp as soil temp for now

    // Save reading with BOTH old and new fields
    const reading = await prisma.sensorReading.create({
        data: {
            nodeId,
            moisture,                    // Old field (raw SMU)
            temperature,                 // Old field (air temp)
            rssi: rssi || -100,
            soilMoistureVWC,            // ✅ NEW FIELD
            soilTemperature,            // ✅ NEW FIELD
        },
    });
    console.log(`✅ Saved reading ID: ${reading.id}`);
    console.log(`🌾 Moisture: ${soilMoistureVWC.toFixed(2)}% VWC, Temp: ${temperature}°C`);

    // Fuzzy logic
    const fuzzyResult = analyzeSoilConditions(moisture, temperature);

    return {
        nodeId,
        moisture,
        temperature,
        rssi: rssi || -100,
        timestamp: reading.timestamp,
        soilStatus: fuzzyResult.recommendation,
        irrigationAdvice: fuzzyResult.irrigationAdvice,
    };
}

// ============================================================================
// NEW API ENDPOINTS
// ============================================================================

/**
 * GET /api/nodes
 * Get all registered nodes
 */
app.get('/api/nodes', async (req: Request, res: Response): Promise<any> => {
    try {
        const nodes = await prisma.node.findMany({
            include: {
                readings: {
                    orderBy: { timestamp: 'desc' },
                    take: 1,
                },
            },
        });

        return res.json({
            status: 'ok',
            count: nodes.length,
            nodes,
        });
    } catch (error) {
        console.error('❌ Error fetching nodes:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch nodes',
        });
    }
});

/**
 * GET /api/sensors/:nodeId/latest
 * Get latest sensor readings for a node
 */
app.get('/api/sensors/:nodeId/latest', async (req: Request, res: Response): Promise<any> => {
    try {
        const nodeId = parseInt(req.params.nodeId || '0');

        if (isNaN(nodeId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid node ID',
            });
        }

        const readings = await prisma.sensorReading.findMany({
            where: { nodeId },
            orderBy: { timestamp: 'desc' },
            take: 10,
        });

        if (readings.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: `No readings found for node ${nodeId}`,
            });
        }

        return res.json({
            status: 'ok',
            nodeId,
            count: readings.length,
            readings,
        });
    } catch (error) {
        console.error('❌ Error fetching readings:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch readings',
        });
    }
});

/**
 * GET /api/gdd/:nodeId/status
 * Get current GDD status and growth stage
 */
app.get('/api/gdd/:nodeId/status', async (req: Request, res: Response): Promise<any> => {
    try {
        const nodeId = parseInt(req.params.nodeId || '0');

        if (isNaN(nodeId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid node ID',
            });
        }

        const gddStatus = await getLatestGDDStatus(nodeId);

        if (!gddStatus.fieldConfig) {
            return res.status(404).json({
                status: 'error',
                message: `No field configuration found for node ${nodeId}. Please configure crop first.`,
            });
        }

        if (!gddStatus.latestGDD) {
            return res.json({
                status: 'ok',
                message: 'No GDD data yet. Waiting for daily calculations.',
                fieldConfig: gddStatus.fieldConfig,
                gddData: null,
            });
        }

        const daysElapsed = gddStatus.fieldConfig.sowingDate
            ? getDaysElapsed(gddStatus.fieldConfig.sowingDate)
            : 0;

        const growthInfo = gddStatus.fieldConfig.cropType
            ? getGrowthStageInfo(
                gddStatus.fieldConfig.cropType,
                gddStatus.latestGDD.cumulativeGDD,
                daysElapsed
            )
            : null;

        return res.json({
            status: 'ok',
            nodeId,
            fieldConfig: gddStatus.fieldConfig,
            gddData: {
                date: gddStatus.latestGDD.date,
                dailyGDD: gddStatus.latestGDD.dailyGDD,
                cumulativeGDD: gddStatus.latestGDD.cumulativeGDD,
                avgSoilTemp: gddStatus.latestGDD.avgSoilTemp,
                growthStage: gddStatus.latestGDD.growthStage,
                totalGDDRequired: gddStatus.totalGDDRequired,
                progressPercentage: gddStatus.totalGDDRequired
                    ? (gddStatus.latestGDD.cumulativeGDD / gddStatus.totalGDDRequired) * 100
                    : 0,
                daysElapsed,
            },
            growthInfo,
        });
    } catch (error) {
        console.error('❌ Error fetching GDD status:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch GDD status',
        });
    }
});

/**
 * POST /api/gdd/:nodeId/calculate
 * Manually trigger GDD calculation for date range (backfill)
 */
app.post('/api/gdd/:nodeId/calculate', async (req: Request, res: Response): Promise<any> => {
    try {
        const nodeId = parseInt(req.params.nodeId || '0');
        const { startDate, endDate } = req.body;

        if (isNaN(nodeId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid node ID',
            });
        }

        if (!startDate || !endDate) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields: startDate, endDate',
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        await calculateGDDForDateRange(nodeId, start, end);

        return res.json({
            status: 'ok',
            message: `GDD calculated for ${startDate} to ${endDate}`,
            nodeId,
        });
    } catch (error) {
        console.error('❌ Error calculating GDD:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to calculate GDD',
        });
    }
});

/**
 * GET /api/crops/:nodeId/recommend
 * Get crop recommendations based on soil moisture and conditions
 */
app.get('/api/crops/:nodeId/recommend', async (req: Request, res: Response): Promise<any> => {
    try {
        const nodeId = parseInt(req.params.nodeId || '0');

        if (isNaN(nodeId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid node ID',
            });
        }

        const recommendations = await recommendCropsForUP(nodeId);

        return res.json({
            status: 'ok',
            nodeId,
            bestCrop: recommendations.bestCrop,
            bestCropHindi: translateCropName(recommendations.bestCrop, 'hi'),
            confidence: recommendations.confidence,
            summary: recommendations.summary,
            topCrops: recommendations.allCrops,
            validUPCrops: UP_VALID_CROPS,
        });
    } catch (error) {
        console.error('❌ Error generating recommendations:', error);
        return res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to generate recommendations',
        });
    }
});

/**
 * GET /api/irrigation/:nodeId/recommend
 * Get irrigation recommendation
 */
app.get('/api/irrigation/:nodeId/recommend', async (req: Request, res: Response): Promise<any> => {
    try {
        const nodeId = parseInt(req.params.nodeId || '0');

        if (isNaN(nodeId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid node ID',
            });
        }

        // Optionally fetch weather
        const fieldConfig = await prisma.fieldConfig.findUnique({
            where: { nodeId },
        });

        let weatherData: any = null;
        if (fieldConfig?.latitude && fieldConfig?.longitude) {
            weatherData = await fetchWeatherWithCache(fieldConfig.latitude, fieldConfig.longitude);
        }

        const decision = await makeIrrigationDecision(nodeId, weatherData);

        // ✅ FIXED: Type-safe response construction
        return res.json({
            status: 'ok',
            nodeId,
            decision,
            weather: weatherData ? {
                temperature: weatherData.current?.temp ?? null,
                humidity: weatherData.current?.humidity ?? null,
                precipitation: weatherData.daily?.[0]?.precipitation ?? null,
                next3DaysRain: weatherData.daily
                    ? weatherData.daily.slice(0, 3).reduce((sum: number, day: any) => {
                        return sum + (day?.precipitation ?? 0);
                    }, 0)
                    : 0,
            } : null,
            fieldConfig: fieldConfig ? {
                cropType: fieldConfig.cropType ?? 'unknown',
                sowingDate: fieldConfig.sowingDate,
                latitude: fieldConfig.latitude,
                longitude: fieldConfig.longitude,
            } : null,
        });
    } catch (error) {
        console.error('❌ Error making irrigation decision:', error);
        return res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'Failed to make irrigation decision',
        });
    }
});

/**
 * POST /api/irrigation/:nodeId/record
 * Record actual irrigation action taken
 */
app.post('/api/irrigation/:nodeId/record', async (req: Request, res: Response): Promise<any> => {
    try {
        const nodeId = parseInt(req.params.nodeId || '0');
        const { waterAppliedMm } = req.body;

        if (isNaN(nodeId) || !waterAppliedMm) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid input: nodeId and waterAppliedMm required',
            });
        }

        await recordIrrigationAction(nodeId, waterAppliedMm);

        return res.json({
            status: 'ok',
            message: `Recorded ${waterAppliedMm}mm irrigation for node ${nodeId}`,
        });
    } catch (error) {
        console.error('❌ Error recording irrigation:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to record irrigation action',
        });
    }
});

/**
 * POST /api/fields/configure
 * Configure field with crop, sowing date, and soil type
 */
app.post('/api/fields/configure', async (req: Request, res: Response): Promise<any> => {
    try {
        const { nodeId, fieldName, cropType, sowingDate, soilTexture, latitude, longitude } =
            req.body;

        if (!nodeId || !cropType || !sowingDate) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields: nodeId, cropType, sowingDate',
            });
        }

        // Validate crop is UP-valid
        const normalizedCrop = cropType.toLowerCase().replace(/\s+/g, '');
        if (!(UP_VALID_CROPS as readonly string[]).includes(normalizedCrop)) {
            return res.status(400).json({
                status: 'error',
                message: `Invalid crop for UP. Valid crops: ${UP_VALID_CROPS.join(', ')}`,
            });
        }

        // Get crop parameters
        const baseTemp = getCropBaseTemp(cropType);
        const totalGDD = getCropGDDRequirement(cropType);

        const fieldConfig = await prisma.fieldConfig.upsert({
            where: { nodeId },
            update: {
                fieldName: fieldName || `Field ${nodeId}`,
                cropType: normalizedCrop,
                sowingDate: new Date(sowingDate),
                soilTexture: soilTexture || 'SANDY_LOAM',
                baseTemperature: baseTemp,
                expectedGDDTotal: totalGDD,
                latitude: latitude || null,
                longitude: longitude || null,
            },
            create: {
                nodeId,
                fieldName: fieldName || `Field ${nodeId}`,
                cropType: normalizedCrop,
                sowingDate: new Date(sowingDate),
                soilTexture: soilTexture || 'SANDY_LOAM',
                baseTemperature: baseTemp,
                expectedGDDTotal: totalGDD,
                latitude: latitude || null,
                longitude: longitude || null,
            },
        });

        console.log(`✅ Field configured: Node ${nodeId}, Crop: ${cropType}`);
        if (latitude && longitude) {
            console.log(`📍 Location set: ${latitude}, ${longitude}`);
        }

        // ✅ FIXED: Backfill GDD only for last 30 days or from sowing date (whichever is shorter)
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const sowingDateObj = new Date(sowingDate);
            sowingDateObj.setHours(0, 0, 0, 0);

            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Start from whichever is more recent: sowing date or 30 days ago
            const startDate = sowingDateObj > thirtyDaysAgo ? sowingDateObj : thirtyDaysAgo;

            const startDateStr = startDate.toISOString().split('T')[0];
            const todayStr = today.toISOString().split('T')[0];

            console.log(`📊 GDD backfill: ${startDateStr} to ${todayStr}`);

            await calculateGDDForDateRange(nodeId, startDate, today);

            console.log(`✅ GDD backfilled successfully`);
        } catch (gddError) {
            console.error('⚠️ [GDD] Backfill warning:', gddError);
            // Don't fail field configuration if GDD backfill fails
        }

        // Publish to dashboard
        publishToDashboard({
            event: 'field_configured',
            nodeId,
            cropType: normalizedCrop,
            cropTypeHindi: translateCropName(cropType, 'hi'),
            sowingDate: fieldConfig.sowingDate,
            message: `Field configured with ${cropType}`,
        });

        return res.json({
            status: 'ok',
            message: 'Field configured successfully',
            fieldConfig,
        });
    } catch (error) {
        console.error('❌ Error configuring field:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to configure field',
        });
    }
});

// ============================================================================
// LEGACY ENDPOINTS (Kept for backward compatibility)
// ============================================================================

/**
 * POST /api/sensor (LEGACY - NOW SAVES VWC)
 */
app.post('/api/sensor', async (req: Request, res: Response): Promise<any> => {
    try {
        const payload: SensorPayload = req.body;

        if (!payload.nodeId || payload.moisture === undefined || payload.temperature === undefined) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields: nodeId, moisture, temperature',
            });
        }

        const result = await processSensorDataLegacy(payload);
        return res.json({ status: 'ok', data: result });
    } catch (error) {
        console.error('❌ Error processing sensor data:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
        });
    }
});

/**
 * GET /api/data/latest (LEGACY - Updated with analysis)
 */
app.get('/api/data/latest', async (req: Request, res: Response): Promise<any> => {
    try {
        console.log('[API] Fetching latest data with analysis...');

        // Get latest readings from last 1 hour for each node
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);

        const readings = await prisma.sensorReading.findMany({
            where: {
                timestamp: { gte: oneHourAgo },
            },
            orderBy: { timestamp: 'desc' },
            include: {
                node: true,
            },
        });

        // Group by nodeId and get latest per node
        const latestByNode = new Map<number, any>();
        for (const reading of readings) {
            if (!latestByNode.has(reading.nodeId)) {
                latestByNode.set(reading.nodeId, reading);
            }
        }

        // Enrich with crop and irrigation data
        const enrichedReadings = await Promise.all(
            Array.from(latestByNode.values()).map(async (reading) => {
                let cropData, irrigationData;

                try {
                    cropData = await recommendCropsForUP(reading.nodeId);
                    console.log(`✅ Crop for node ${reading.nodeId}: ${cropData.bestCrop}`);
                } catch (e) {
                    console.error(`❌ Crop rec error for node ${reading.nodeId}:`, e);
                }

                try {
                    irrigationData = await makeIrrigationDecision(reading.nodeId, undefined);
                    console.log(`✅ Irrigation for node ${reading.nodeId}: ${irrigationData.urgency}`);
                } catch (e) {
                    console.error(`❌ Irrigation error for node ${reading.nodeId}:`, e);
                }

                // Determine soil status from urgency
                let soilStatus = 'optimal';
                if (irrigationData?.urgency === 'CRITICAL' || irrigationData?.urgency === 'HIGH') {
                    soilStatus = 'dry';
                } else if (irrigationData?.urgency === 'LOW') {
                    soilStatus = 'optimal';
                } else {
                    soilStatus = 'wet';
                }

                return {
                    ...reading,
                    analysis: {
                        soilStatus,
                        irrigationAdvice: irrigationData?.reason || 'Processing...',
                        confidence: (irrigationData?.confidence || 0) * 100,
                        fuzzyDryScore: soilStatus === 'dry' ? 0.8 : 0.2,
                        fuzzyOptimalScore: soilStatus === 'optimal' ? 0.8 : 0.2,
                        fuzzyWetScore: soilStatus === 'wet' ? 0.8 : 0.2,
                        cropRecommendations: cropData?.allCrops?.map((crop: any) => ({
                            cropName: crop.cropName,
                            suitability: crop.suitability,
                            reason: crop.reason,
                        })) || [],
                    },
                };
            })
        );

        console.log(`[API] Returning ${enrichedReadings.length} enriched readings`);
        return res.json(enrichedReadings);
    } catch (error) {
        console.error('❌ Error fetching latest data:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
        });
    }
});

/**
 * POST /api/crop/confirm (LEGACY - Phase 2 compatibility)
 */
app.post('/api/crop/confirm', async (req: Request, res: Response): Promise<any> => {
    try {
        const { fieldId, cropName, sowingDate, soilType } = req.body;

        if (!fieldId || !cropName || !sowingDate) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required fields: fieldId, cropName, sowingDate',
            });
        }

        // Map fieldId to nodeId
        const nodeId = fieldId;

        // Normalize crop name
        const normalizedCrop = cropName.toLowerCase().replace(/\s+/g, '');

        if (!(UP_VALID_CROPS as readonly string[]).includes(normalizedCrop)) {
            return res.status(400).json({
                status: 'error',
                message: `Invalid crop: ${cropName}. Valid crops: ${UP_VALID_CROPS.join(', ')}`,
            });
        }

        // Get crop parameters
        const baseTemp = getCropBaseTemp(normalizedCrop);
        const totalGDD = getCropGDDRequirement(normalizedCrop);

        // Map soil type
        const soilTextureMap: { [key: string]: string } = {
            'LOAM': 'LOAM',
            'SANDY_LOAM': 'SANDY_LOAM',
            'CLAY_LOAM': 'CLAY_LOAM',
            'SANDY': 'SANDY',
            'CLAY': 'CLAY',
        };
        const soilTexture = soilTextureMap[soilType] || 'SANDY_LOAM';

        // Create or update field config
        const fieldConfig = await prisma.fieldConfig.upsert({
            where: { nodeId },
            update: {
                cropType: normalizedCrop,
                sowingDate: new Date(sowingDate),
                soilTexture,
                baseTemperature: baseTemp,
                expectedGDDTotal: totalGDD,
            },
            create: {
                nodeId,
                fieldName: `Field ${nodeId}`,
                cropType: normalizedCrop,
                sowingDate: new Date(sowingDate),
                soilTexture,
                baseTemperature: baseTemp,
                expectedGDDTotal: totalGDD,
            },
        });

        console.log(`✅ Crop confirmed: ${cropName} for field ${fieldId}`);

        // Publish to dashboard
        publishToDashboard({
            event: 'crop_confirmed',
            nodeId,
            cropType: normalizedCrop,
            cropTypeHindi: translateCropName(normalizedCrop, 'hi'),
            sowingDate: fieldConfig.sowingDate,
            message: `Crop ${cropName} confirmed`,
        });

        return res.json({
            status: 'ok',
            message: `Crop ${cropName} confirmed successfully`,
            fieldConfig: {
                fieldId,
                cropName: normalizedCrop,
                cropNameHindi: translateCropName(normalizedCrop, 'hi'),
                sowingDate: fieldConfig.sowingDate,
                soilType: soilTexture,
                baseTemperature: baseTemp,
                expectedGDDTotal: totalGDD,
            },
        });
    } catch (error) {
        console.error('❌ Error confirming crop:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to confirm crop',
        });
    }
});

/**
 * GET /api/field/:fieldId (LEGACY - Phase 2 compatibility)
 */
app.get('/api/field/:fieldId', async (req: Request, res: Response): Promise<any> => {
    try {
        const fieldId = parseInt(req.params.fieldId || '0');

        if (isNaN(fieldId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid field ID',
            });
        }

        // Map fieldId to nodeId
        const nodeId = fieldId;

        const fieldConfig = await prisma.fieldConfig.findUnique({
            where: { nodeId },
        });

        if (!fieldConfig) {
            return res.status(404).json({
                status: 'error',
                message: `Field ${fieldId} not found`,
            });
        }

        return res.json({
            status: 'ok',
            field: {
                id: fieldId,
                nodeId: fieldConfig.nodeId,
                fieldName: fieldConfig.fieldName,
                cropName: fieldConfig.cropType || 'unknown',
                cropNameHindi: translateCropName(fieldConfig.cropType || 'unknown', 'hi'),
                sowingDate: fieldConfig.sowingDate,
                soilType: fieldConfig.soilTexture,
                baseTemperature: fieldConfig.baseTemperature,
                expectedGDDTotal: fieldConfig.expectedGDDTotal,
            },
        });
    } catch (error) {
        console.error('❌ Error fetching field details:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch field details',
        });
    }
});

/**
 * GET /api/alerts/active
 */
app.get('/api/alerts/active', async (req: Request, res: Response): Promise<any> => {
    try {
        const alerts = await prisma.alert.findMany({
            where: { acknowledged: false },
            orderBy: { sentAt: 'desc' },
            take: 20,
        });

        return res.json(alerts);
    } catch (error) {
        console.error('❌ Error fetching alerts:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
        });
    }
});

/**
 * GET /api/crops/info
 */
app.get('/api/crops/info', async (req: Request, res: Response): Promise<any> => {
    try {
        const crops = await prisma.cropParameters.findMany({
            where: { validForUP: true },
            orderBy: { cropName: 'asc' },
        });

        return res.json({
            status: 'ok',
            totalCrops: crops.length,
            crops,
            validUPCrops: UP_VALID_CROPS,
        });
    } catch (error) {
        console.error('❌ Error fetching crop info:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch crop info',
        });
    }
});

/**
 * GET /api/weather/forecast
 */
app.get('/api/weather/forecast', async (req: Request, res: Response): Promise<any> => {
    try {
        const { lat, lon } = req.query;

        if (!lat || !lon) {
            return res.status(400).json({
                status: 'error',
                message: 'Missing required parameters: lat, lon',
            });
        }

        const latitude = parseFloat(lat as string);
        const longitude = parseFloat(lon as string);

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid coordinates',
            });
        }

        const weatherData = await fetchWeatherWithCache(latitude, longitude);

        return res.json({
            status: 'ok',
            location: { latitude, longitude },
            data: weatherData,
        });
    } catch (error) {
        console.error('❌ Error fetching weather:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch weather data',
        });
    }
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = createServer(app);

server.listen(PORT, () => {
    console.log(`\n✅ WUSN Backend Server Started`);
    console.log(`   HTTP API: http://localhost:${PORT}`);
    console.log(`   MQTT Broker: mqtt://localhost:1883`);
    console.log(`   Database: PostgreSQL (Prisma)`);
    console.log(`   Region: Uttar Pradesh, India`);
    console.log(`   Valid Crops: ${UP_VALID_CROPS.length} (${UP_VALID_CROPS.join(', ')})`);
    console.log(`\n📡 System ready. Waiting for sensor data...\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');

    const client = getMqttClient();
    if (client) {
        client.end();
    }

    await prisma.$disconnect();

    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
