// src/controllers/nodeController.ts
import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';

const createNodeSchema = z.object({
    nodeId: z.number().int().positive(),
    location: z.string().optional(),
    burialDepth: z.number().int().optional(),
    distanceToGW: z.number().optional(),
});

export async function createNodeController(req: Request, res: Response): Promise<void> {
    const data = createNodeSchema.parse(req.body);

    // Build create data conditionally to avoid undefined
    const createData: any = {
        nodeId: data.nodeId,
        isActive: true,
    };
    if (data.location !== undefined) createData.location = data.location;
    if (data.burialDepth !== undefined) createData.burialDepth = data.burialDepth;
    if (data.distanceToGW !== undefined) createData.distanceToGW = data.distanceToGW;

    // Build update data conditionally
    const updateData: any = {
        lastSeen: new Date(),
    };
    if (data.location !== undefined) updateData.location = data.location;
    if (data.burialDepth !== undefined) updateData.burialDepth = data.burialDepth;
    if (data.distanceToGW !== undefined) updateData.distanceToGW = data.distanceToGW;

    const node = await prisma.node.upsert({
        where: { nodeId: data.nodeId },
        create: createData,
        update: updateData,
    });

    res.status(201).json({
        status: 'ok',
        data: node,
        timestamp: new Date().toISOString(),
    });
}

export async function getNodesController(_req: Request, res: Response): Promise<void> {
    const nodes = await prisma.node.findMany({
        include: {
            readings: {
                take: 1,
                orderBy: { timestamp: 'desc' },
            },
        },
    });

    res.json({
        status: 'ok',
        data: nodes,
        timestamp: new Date().toISOString(),
    });
}

export async function getNodeController(req: Request, res: Response): Promise<void> {
    const nodeIdParam = req.params.nodeId;
    if (!nodeIdParam) {
        res.status(400).json({
            status: 'error',
            message: 'nodeId parameter is required',
        });
        return;
    }

    const nodeId = parseInt(nodeIdParam, 10);
    if (isNaN(nodeId)) {
        res.status(400).json({
            status: 'error',
            message: 'nodeId must be a valid number',
        });
        return;
    }

    const node = await prisma.node.findUnique({
        where: { nodeId },
        include: {
            readings: {
                take: 10,
                orderBy: { timestamp: 'desc' },
            },
        },
    });

    if (!node) {
        res.status(404).json({
            status: 'error',
            message: `Node ${nodeId} not found`,
        });
        return;
    }

    res.json({
        status: 'ok',
        data: node,
        timestamp: new Date().toISOString(),
    });
}
