// src/controllers/fieldController.ts
/**
 * Field Configuration Controller
 */

import type { Request, Response } from 'express';
import { z } from 'zod';
import * as fieldRepo from '../repositories/field.repository.js';
import { ValidationError } from '../utils/errors.js';
import type { SoilTexture, UPCropName } from '../utils/constants.js';

const createFieldSchema = z.object({
    nodeId: z.number().int().positive(),
    fieldName: z.string().min(1).max(100),
    soilTexture: z.enum(['SANDY', 'SANDY_LOAM', 'LOAM', 'CLAY_LOAM', 'CLAY']),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
});

const updateFieldSchema = z.object({
    fieldName: z.string().min(1).max(100).optional(),
    cropType: z.enum([
        'chickpea', 'lentil', 'rice', 'maize', 'cotton', 'pigeonpeas',
        'mothbeans', 'mungbean', 'blackgram', 'kidneybeans', 'watermelon', 'muskmelon'
    ]).nullable().optional(),
    sowingDate: z.string().datetime().transform(str => new Date(str)).nullable().optional(),
    soilTexture: z.enum(['SANDY', 'SANDY_LOAM', 'LOAM', 'CLAY_LOAM', 'CLAY']).optional(),
    baseTemperature: z.number().min(0).max(30).nullable().optional(),
    expectedGDDTotal: z.number().min(0).nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
});

export async function createField(req: Request, res: Response): Promise<void> {
    const validated = createFieldSchema.parse(req.body);

    const field = await fieldRepo.createFieldConfig({
        nodeId: validated.nodeId,
        fieldName: validated.fieldName,
        soilTexture: validated.soilTexture as SoilTexture,
        latitude: validated.latitude,
        longitude: validated.longitude,
    });

    res.status(201).json({
        status: 'ok',
        data: field,
        timestamp: new Date().toISOString(),
    });
}

export async function getField(req: Request, res: Response): Promise<void> {
    const nodeIdParam = req.params.nodeId;

    if (!nodeIdParam) {
        throw new ValidationError('nodeId parameter is required');
    }

    const nodeId = parseInt(nodeIdParam, 10);

    if (isNaN(nodeId) || nodeId <= 0) {
        throw new ValidationError('Invalid nodeId');
    }

    const field = await fieldRepo.getFieldConfigOrThrow(nodeId);

    res.json({
        status: 'ok',
        data: field,
        timestamp: new Date().toISOString(),
    });
}

export async function getAllFields(req: Request, res: Response): Promise<void> {
    const fields = await fieldRepo.getAllFieldConfigs();

    res.json({
        status: 'ok',
        data: fields,
        timestamp: new Date().toISOString(),
    });
}

export async function updateField(req: Request, res: Response): Promise<void> {
    const nodeIdParam = req.params.nodeId;

    if (!nodeIdParam) {
        throw new ValidationError('nodeId parameter is required');
    }

    const nodeId = parseInt(nodeIdParam, 10);

    if (isNaN(nodeId) || nodeId <= 0) {
        throw new ValidationError('Invalid nodeId');
    }

    const validated = updateFieldSchema.parse(req.body);

    const field = await fieldRepo.updateFieldConfig(nodeId, {
        fieldName: validated.fieldName,
        cropType: validated.cropType as UPCropName | null | undefined,
        sowingDate: validated.sowingDate,
        soilTexture: validated.soilTexture as SoilTexture | undefined,
        baseTemperature: validated.baseTemperature,
        expectedGDDTotal: validated.expectedGDDTotal,
        latitude: validated.latitude,
        longitude: validated.longitude,
    });

    res.json({
        status: 'ok',
        data: field,
        timestamp: new Date().toISOString(),
    });
}

export async function deleteField(req: Request, res: Response): Promise<void> {
    const nodeIdParam = req.params.nodeId;

    if (!nodeIdParam) {
        throw new ValidationError('nodeId parameter is required');
    }

    const nodeId = parseInt(nodeIdParam, 10);

    if (isNaN(nodeId) || nodeId <= 0) {
        throw new ValidationError('Invalid nodeId');
    }

    await fieldRepo.deleteFieldConfig(nodeId);

    res.status(204).send();
}
