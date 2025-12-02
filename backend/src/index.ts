import express from "express";
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import { createServer } from "http";
import { analyzeSoilConditions } from "./fuzzyService.js";
import { recommendCrop, validateNorthIndiaConditions } from "./cropRecommendationService.js";
import { initMqtt, publishToDashboard } from "./mqttService.js";
import { translateCropName } from "./cropTranslations.js";
import { translateIrrigation, translateSummary } from "./irrigationTranslations.js";

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3000;

interface SensorPayload {
    nodeId: number;
    moisture: number;
    temperature: number;
    rssi?: number;
}

// Initialize MQTT
const mqttClient = initMqtt();

// MQTT message handler
mqttClient.on('message', async (topic, message) => {
    try {
        const payload: SensorPayload = JSON.parse(message.toString());
        console.log(`📨 MQTT Received from ${topic}:`, payload);

        await processSensorData(payload);
    } catch (error) {
        console.error('❌ MQTT message processing error:', error);
    }
});

/**
 * Core processing function
 */
async function processSensorData(payload: SensorPayload) {
    const { nodeId, moisture, temperature, rssi } = payload;

    console.log(`\n🔄 Processing sensor data for Node ${nodeId}...`);

    // Step 1: Update or create node
    await prisma.node.upsert({
        where: { nodeId },
        update: { lastSeen: new Date(), isActive: true },
        create: {
            nodeId,
            location: `Node ${nodeId}`,
            burialDepth: 40,
            isActive: true
        }
    });

    // Step 2: Save raw sensor reading
    const reading = await prisma.sensorReading.create({
        data: {
            nodeId,
            moisture,
            temperature,
            rssi: rssi || -100
        }
    });
    console.log(`✅ Saved reading ID: ${reading.id}`);

    // Step 3: Run fuzzy logic analysis
    const fuzzyResult = analyzeSoilConditions(moisture, temperature);
    console.log(`🧮 Fuzzy Analysis: ${fuzzyResult.recommendation} (${fuzzyResult.confidence}%)`);

    // Step 4: Run crop recommendation (DATASET INTEGRATED)
    const cropRecommendation = recommendCrop(moisture, temperature, fuzzyResult);
    console.log(`🌾 Best Crop: ${cropRecommendation.bestCrop} (${cropRecommendation.confidence}%)`);

    // Step 4.5: Validate for North India RWCS region
    const validation = validateNorthIndiaConditions(
        cropRecommendation.bestCrop,
        temperature,
        moisture
    );
    if (!validation.valid) {
        console.log(`⚠️  North India Warnings:`, validation.warnings);
    }

    // Step 5: Save analysis results
    const analysis = await prisma.analysis.create({
        data: {
            readingId: reading.id,
            fuzzyDryScore: fuzzyResult.fuzzyScores.dry,
            fuzzyOptimalScore: fuzzyResult.fuzzyScores.optimal,
            fuzzyWetScore: fuzzyResult.fuzzyScores.wet,
            soilStatus: fuzzyResult.recommendation,
            confidence: fuzzyResult.confidence,
            irrigationAdvice: fuzzyResult.irrigationAdvice,
            urgency: fuzzyResult.confidence > 80 ? 'critical' :
                fuzzyResult.confidence > 50 ? 'moderate' : 'low'
        }
    });
    console.log(`✅ Saved analysis ID: ${analysis.id}`);

    // Step 6: Save crop recommendations (Top 5 from dataset)
    const cropPromises = cropRecommendation.allCrops.map((crop, index) =>
        prisma.cropRecommendation.create({
            data: {
                analysisId: analysis.id,
                cropName: crop.cropName,
                suitability: crop.suitability,
                reason: crop.reason,
                rank: index + 1
            }
        })
    );
    await Promise.all(cropPromises);
    console.log(`✅ Saved ${cropRecommendation.allCrops.length} crop recommendations`);

    // Step 7: Create alert if critical
    if (fuzzyResult.confidence > 80 && fuzzyResult.recommendation !== 'optimal') {
        await prisma.alert.create({
            data: {
                nodeId,
                readingId: reading.id,
                alertType: fuzzyResult.recommendation === 'needs_water'
                    ? 'critical_dry'
                    : 'critical_wet',
                message: fuzzyResult.irrigationAdvice
            }
        });
        console.log(`🚨 Created alert for Node ${nodeId}`);
    }

    // Step 7.5: Create alert for North India validation warnings
    if (!validation.valid && validation.warnings.length > 0) {
        await prisma.alert.create({
            data: {
                nodeId,
                readingId: reading.id,
                alertType: 'warning',
                message: `Regional Warning: ${validation.warnings.join('; ')}`
            }
        });
        console.log(`⚠️  Created regional warning alert`);
    }

    // Step 8: Publish to dashboard via MQTT
    const dashboardUpdate = {
        nodeId,
        moisture,
        temperature,
        rssi: rssi || -100,
        timestamp: reading.timestamp,
        soilStatus: fuzzyResult.recommendation,
        irrigationAdvice: fuzzyResult.irrigationAdvice,
        irrigationAdviceHi: translateIrrigation(fuzzyResult.irrigationAdvice),
        confidence: fuzzyResult.confidence,
        fuzzyScores: fuzzyResult.fuzzyScores,
        bestCrop: cropRecommendation.bestCrop,
        bestCropHi: translateCropName(cropRecommendation.bestCrop, 'hi'),
        cropConfidence: cropRecommendation.confidence,
        alternativeCrops: cropRecommendation.allCrops.slice(1, 4),
        summary: cropRecommendation.summary,
        summaryHi: translateSummary(
            cropRecommendation.summary,
            translateCropName(cropRecommendation.bestCrop, 'hi')
        ),
        regionalWarnings: validation.warnings
    };

    publishToDashboard(dashboardUpdate);

    console.log(`✅ Processing complete for Node ${nodeId}\n`);

    return dashboardUpdate;
}

/**
 * NEW: POST endpoint for aggregated multi-node data
 */
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

app.post("/api/sensor/aggregated", async (req: Request, res: Response): Promise<any> => {
    try {
        const payload: AggregatedPayload = req.body;

        if (!payload.nodes || payload.nodes.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "No nodes data provided"
            });
        }

        console.log(`\nReceived aggregated data from ${payload.nodes.length} nodes`);

        // Import node selection service
        const { selectBestNode, filterBlockedNodes } = await import('./nodeSelectionService.js');

        // Filter out blocked nodes
        const { activeNodes, blockedNodes } = filterBlockedNodes(payload.nodes);

        console.log(`Active nodes: ${activeNodes.length}, Blocked nodes: ${blockedNodes.length}`);

        if (activeNodes.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "All nodes are blocked (low battery or weak signal)"
            });
        }

        // Select best node
        const selection = selectBestNode(activeNodes);
        const bestNode = selection.bestNode;

        console.log(`Selected Node ${bestNode.nodeId}: ${selection.reason}`);

        // Save aggregated reading
        const aggregatedReading = await prisma.aggregatedReading.create({
            data: {
                timestamp: new Date(payload.timestamp),
                selectedNodeId: bestNode.nodeId,
                allNodesData: payload.nodes as any,
                selectionScore: selection.score,
                selectionReason: selection.reason
            }
        });

        // Run fuzzy logic on best node data
        const fuzzyResult = analyzeSoilConditions(bestNode.moisture, bestNode.temperature);
        console.log(`Fuzzy Analysis: ${fuzzyResult.recommendation} (${fuzzyResult.confidence}%)`);

        // Run crop recommendation
        const cropRecommendation = recommendCrop(bestNode.moisture, bestNode.temperature, fuzzyResult);
        console.log(`Best Crop: ${cropRecommendation.bestCrop} (${cropRecommendation.confidence}%)`);

        // Validate for North India
        const validation = validateNorthIndiaConditions(
            cropRecommendation.bestCrop,
            bestNode.temperature,
            bestNode.moisture
        );

        // Save aggregated analysis
        const aggregatedAnalysis = await prisma.aggregatedAnalysis.create({
            data: {
                aggregatedReadingId: aggregatedReading.id,
                fuzzyDryScore: fuzzyResult.fuzzyScores.dry,
                fuzzyOptimalScore: fuzzyResult.fuzzyScores.optimal,
                fuzzyWetScore: fuzzyResult.fuzzyScores.wet,
                soilStatus: fuzzyResult.recommendation,
                confidence: fuzzyResult.confidence,
                irrigationAdvice: fuzzyResult.irrigationAdvice,
                urgency: fuzzyResult.confidence > 80 ? 'critical' :
                    fuzzyResult.confidence > 50 ? 'moderate' : 'low'
            }
        });

        // Save crop recommendations
        const cropPromises = cropRecommendation.allCrops.map((crop, index) =>
            prisma.cropRecommendation.create({
                data: {
                    aggregatedAnalysisId: aggregatedAnalysis.id,
                    cropName: crop.cropName,
                    suitability: crop.suitability,
                    reason: crop.reason,
                    rank: index + 1
                }
            })
        );
        await Promise.all(cropPromises);

        // Create alert if critical
        if (fuzzyResult.confidence > 80 && fuzzyResult.recommendation !== 'optimal') {
            await prisma.alert.create({
                data: {
                    nodeId: bestNode.nodeId,
                    readingId: 0,
                    alertType: fuzzyResult.recommendation === 'needs_water'
                        ? 'critical_dry'
                        : 'critical_wet',
                    message: fuzzyResult.irrigationAdvice
                }
            });
        }

        // Publish to dashboard
        const dashboardUpdate = {
            aggregated: true,
            selectedNodeId: bestNode.nodeId,
            selectionReason: selection.reason,
            selectionScore: selection.score,
            totalNodes: payload.nodes.length,
            activeNodes: activeNodes.length,
            blockedNodes: blockedNodes.length,
            moisture: bestNode.moisture,
            temperature: bestNode.temperature,
            rssi: bestNode.rssi,
            batteryLevel: bestNode.batteryLevel,
            timestamp: aggregatedReading.timestamp,
            soilStatus: fuzzyResult.recommendation,
            irrigationAdvice: fuzzyResult.irrigationAdvice,
            confidence: fuzzyResult.confidence,
            fuzzyScores: fuzzyResult.fuzzyScores,
            bestCrop: cropRecommendation.bestCrop,
            cropConfidence: cropRecommendation.confidence,
            alternativeCrops: cropRecommendation.allCrops.slice(1, 4),
            summary: cropRecommendation.summary,
            regionalWarnings: validation.warnings,
            allNodesData: payload.nodes
        };

        publishToDashboard(dashboardUpdate);

        console.log(`Processing complete for aggregated reading\n`);

        return res.json({ status: "ok", data: dashboardUpdate });
    } catch (error) {
        console.error("Error processing aggregated sensor data:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
});

/**
 * HTTP POST endpoint (fallback for gateway)
 */
app.post("/api/sensor", async (req: Request, res: Response): Promise<any> => {
    try {
        const payload: SensorPayload = req.body;

        if (!payload.nodeId || payload.moisture === undefined || payload.temperature === undefined) {
            return res.status(400).json({
                status: "error",
                message: "Missing required fields: nodeId, moisture, temperature"
            });
        }

        const result = await processSensorData(payload);
        return res.json({ status: "ok", data: result });
    } catch (error) {
        console.error("❌ Error processing sensor data:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
});

/**
 * GET latest data with full details
 */
app.get("/api/data/latest", async (req: Request, res: Response): Promise<any> => {
    try {
        const latest = await prisma.sensorReading.findMany({
            orderBy: { timestamp: "desc" },
            take: 10,
            include: {
                node: true,
                analysis: {
                    include: {
                        cropRecommendations: {
                            orderBy: { rank: "asc" },
                            take: 5  // Top 5 crops
                        }
                    }
                }
            }
        });

        return res.json(latest);
    } catch (error) {
        console.error("❌ Error fetching latest data:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
});

/**
 * GET active alerts
 */
app.get("/api/alerts/active", async (req: Request, res: Response): Promise<any> => {
    try {
        const alerts = await prisma.alert.findMany({
            where: { acknowledged: false },
            orderBy: { sentAt: "desc" },
            take: 20
        });

        return res.json(alerts);
    } catch (error) {
        console.error("❌ Error fetching alerts:", error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
});

/**
 * GET crop dataset info (for testing)
 */
app.get("/api/crops/info", async (req: Request, res: Response): Promise<any> => {
    try {
        const { datasetService } = await import('./datasetService.js');

        const allCrops = datasetService.getAllCrops();
        const rabiCrops = datasetService.getSeasonalCrops(20);  // Winter
        const kharifCrops = datasetService.getSeasonalCrops(30); // Summer

        return res.json({
            totalCrops: allCrops.length,
            allCrops,
            rabiSeasonCrops: rabiCrops,
            kharifSeasonCrops: kharifCrops,
            datasetLoaded: true
        });
    } catch (error) {
        console.error("❌ Error fetching crop info:", error);
        return res.status(500).json({
            status: "error",
            message: "Dataset not loaded"
        });
    }
});

// Create HTTP server
const server = createServer(app);

// Start server
server.listen(PORT, () => {
    console.log(`\n✅ Server running on port ${PORT}`);
    console.log(`   HTTP API: http://localhost:${PORT}`);
    console.log(`   MQTT Broker: mqtt://localhost:1883`);
    console.log(`   Dataset: ICAR Crop Recommendation (22 crops)`);
    console.log(`\n📡 Waiting for sensor data...\n`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down gracefully...");

    if (mqttClient) {
        mqttClient.end();
    }

    await prisma.$disconnect();

    server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
    });
});
