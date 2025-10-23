import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import { WebSocketServer } from "ws";
import { getRecommendation } from "./decisionService.js";
import { createServer } from "http";
const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use(cors());
const PORT = 3000;
// HTTP POST from gateway node
app.post("/api/sensor", async (req, res) => {
    try {
        const { nodeId, cropType, moisture, temperature } = req.body;
        // Validate input
        if (!nodeId || !cropType || moisture === undefined || temperature === undefined) {
            return res.status(400).json({ status: "error", message: "Missing required fields" });
        }
        // Save to database
        const data = await prisma.sensorData.create({
            data: { nodeId, cropType, moisture, temperature }
        });
        // Compute recommendation
        const recommendation = getRecommendation(moisture, temperature, cropType);
        // Broadcast to WebSocket clients
        broadcast({
            nodeId,
            cropType,
            moisture,
            temperature,
            timestamp: data.timestamp,
            recommendation
        });
        return res.json({ status: "ok", recommendation });
    }
    catch (error) {
        console.error("Error saving sensor data:", error);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
});
// HTTP GET for latest data (polling fallback)
app.get("/api/data/latest", async (req, res) => {
    try {
        const latest = await prisma.sensorData.findMany({
            orderBy: { timestamp: "desc" },
            take: 10
        });
        // Add recommendations to each data point
        const dataWithRecommendations = latest.map(item => ({
            id: item.id,
            nodeId: item.nodeId,
            cropType: item.cropType,
            moisture: item.moisture,
            temperature: item.temperature,
            timestamp: item.timestamp,
            recommendation: getRecommendation(item.moisture, item.temperature, item.cropType)
        }));
        return res.json(dataWithRecommendations);
    }
    catch (error) {
        console.error("Error fetching latest data:", error);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
});
// Create HTTP server
const server = createServer(app);
// Create WebSocket server
const wss = new WebSocketServer({ server });
// Broadcast function
function broadcast(data) {
    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === 1) { // 1 = OPEN
            client.send(message);
        }
    });
}
// WebSocket connection handler
wss.on("connection", (ws) => {
    console.log("New WebSocket client connected");
    ws.send(JSON.stringify({ message: "Connected to soil monitor WebSocket" }));
    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
    ws.on("close", () => {
        console.log("WebSocket client disconnected");
    });
});
// Start server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`HTTP API: http://localhost:${PORT}`);
    console.log(`WebSocket: ws://localhost:${PORT}`);
});
// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("\nShutting down gracefully...");
    await prisma.$disconnect();
    server.close(() => {
        console.log("Server closed");
        process.exit(0);
    });
});
//# sourceMappingURL=index.js.map