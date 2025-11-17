import express from "express";
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import { createServer } from "http";
import { analyzeSoilConditions } from "./fuzzyService.js";
import { recommendCrop } from "./cropRecommendationService.js";
import { initMqtt, publishToDashboard } from "./mqttService.js";

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

    // Step 4: Run crop recommendation
    const cropRecommendation = recommendCrop(moisture, temperature);
    console.log(`🌾 Best Crop: ${cropRecommendation.bestCrop} (${cropRecommendation.confidence}%)`);

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

    // Step 6: Save crop recommendations
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

    // Step 8: Publish to dashboard via MQTT
    const dashboardUpdate = {
        nodeId,
        moisture,
        temperature,
        rssi: rssi || -100,
        timestamp: reading.timestamp,
        soilStatus: fuzzyResult.recommendation,
        irrigationAdvice: fuzzyResult.irrigationAdvice,
        confidence: fuzzyResult.confidence,
        fuzzyScores: fuzzyResult.fuzzyScores,
        bestCrop: cropRecommendation.bestCrop,
        cropConfidence: cropRecommendation.confidence,
        alternativeCrops: cropRecommendation.allCrops.slice(1, 3),
        summary: cropRecommendation.summary
    };

    publishToDashboard(dashboardUpdate);

    console.log(`✅ Processing complete for Node ${nodeId}\n`);

    return dashboardUpdate;
}

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
                            take: 3
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

// Create HTTP server
const server = createServer(app);

// Start server
server.listen(PORT, () => {
    console.log(`\n✅ Server running on port ${PORT}`);
    console.log(`   HTTP API: http://localhost:${PORT}`);
    console.log(`   MQTT Broker: mqtt://localhost:1883`);
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
