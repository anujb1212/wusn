import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';

const createNodeSchema = z.object({
    nodeId: z.number().int().positive(),
    location: z.string().optional(),
    burialDepth: z.number().int().optional(),
    distanceToGW: z.number().optional(),
});

const nodeIdParamSchema = z.object({
    nodeId: z.coerce.number().int().positive(),
});

export async function createNodeController(req: Request, res: Response): Promise<void> {
    const data = createNodeSchema.parse(req.body);

    const createData: any = {
        nodeId: data.nodeId,
        isActive: true,
    };
    if (data.location !== undefined) createData.location = data.location;
    if (data.burialDepth !== undefined) createData.burialDepth = data.burialDepth;
    if (data.distanceToGW !== undefined) createData.distanceToGW = data.distanceToGW;

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

// DELETE /api/nodes/:nodeId
export async function deleteNodeController(req: Request, res: Response): Promise<void> {
    const { nodeId } = nodeIdParamSchema.parse(req.params);

    // First, delete all sensor readings for this node to avoid FK issues.
    await prisma.sensorReading.deleteMany({
        where: { nodeId },
    });

    // Then delete the node itself.
    await prisma.node.delete({
        where: { nodeId },
    });

    res.json({
        status: 'ok',
        data: {
            nodeId,
            deleted: true,
        },
        timestamp: new Date().toISOString(),
    });
}
