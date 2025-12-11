// src/repositories/field.repository.ts
/**
 * Field Repository
 */

import { prisma } from '../config/database.js';
import { DatabaseError, NotFoundError } from '../utils/errors.js';
import type { SoilTexture, CropName } from '../utils/constants.js';

export interface CreateFieldInput {
    nodeId: number;
    gatewayId: string;
    fieldName: string;
    latitude: number;
    longitude: number;
    soilTexture: SoilTexture;
    location?: string | undefined;
}

export interface UpdateFieldCropInput {
    cropType: CropName;
    sowingDate: Date;
    baseTemperature: number;
    expectedGDDTotal: number;
    expectedHarvestDate?: Date | undefined;
}

/**
 * Create field
 */
export async function createField(input: CreateFieldInput) {
    try {
        return await prisma.field.create({
            data: {
                nodeId: input.nodeId,
                gatewayId: input.gatewayId,
                fieldName: input.fieldName,
                latitude: input.latitude,
                longitude: input.longitude,
                soilTexture: input.soilTexture,
                location: input.location ?? null,
            },
        });
    } catch (error) {
        throw new DatabaseError('createField', error as Error);
    }
}

/**
 * Get field by node ID
 */
export async function getFieldByNodeId(nodeId: number) {
    try {
        const field = await prisma.field.findUnique({
            where: { nodeId },
        });

        if (!field) {
            throw new NotFoundError('Field', `nodeId=${nodeId}`);
        }

        return field;
    } catch (error) {
        if (error instanceof NotFoundError) throw error;
        throw new DatabaseError('getFieldByNodeId', error as Error);
    }
}

/**
 * Get field by ID
 */
export async function getFieldById(id: number) {
    try {
        const field = await prisma.field.findUnique({
            where: { id },
        });

        if (!field) {
            throw new NotFoundError('Field', `id=${id}`);
        }

        return field;
    } catch (error) {
        if (error instanceof NotFoundError) throw error;
        throw new DatabaseError('getFieldById', error as Error);
    }
}

/**
 * Get all fields
 */
export async function getAllFields() {
    try {
        return await prisma.field.findMany({
            orderBy: { fieldName: 'asc' },
        });
    } catch (error) {
        throw new DatabaseError('getAllFields', error as Error);
    }
}

/**
 * Update field crop configuration
 */
export async function updateFieldCrop(nodeId: number, input: UpdateFieldCropInput) {
    try {
        return await prisma.field.update({
            where: { nodeId },
            data: {
                cropType: input.cropType,
                sowingDate: input.sowingDate,
                baseTemperature: input.baseTemperature,
                expectedGDDTotal: input.expectedGDDTotal,
                expectedHarvestDate: input.expectedHarvestDate ?? null,
                cropConfirmed: true,
                accumulatedGDD: 0, // Reset GDD on crop change
                currentGrowthStage: 'INITIAL',
                lastGDDUpdate: null,
            },
        });
    } catch (error) {
        throw new DatabaseError('updateFieldCrop', error as Error);
    }
}

/**
 * Update field GDD status
 */
export async function updateFieldGDD(
    nodeId: number,
    accumulatedGDD: number,
    growthStage: string
) {
    try {
        return await prisma.field.update({
            where: { nodeId },
            data: {
                accumulatedGDD,
                currentGrowthStage: growthStage,
                lastGDDUpdate: new Date(),
            },
        });
    } catch (error) {
        throw new DatabaseError('updateFieldGDD', error as Error);
    }
}

/**
 * Update last irrigation check
 */
export async function updateLastIrrigationCheck(nodeId: number) {
    try {
        return await prisma.field.update({
            where: { nodeId },
            data: {
                lastIrrigationCheck: new Date(),
            },
        });
    } catch (error) {
        throw new DatabaseError('updateLastIrrigationCheck', error as Error);
    }
}

/**
 * Record irrigation action
 */
export async function recordIrrigationAction(nodeId: number) {
    try {
        return await prisma.field.update({
            where: { nodeId },
            data: {
                lastIrrigationAction: new Date(),
            },
        });
    } catch (error) {
        throw new DatabaseError('recordIrrigationAction', error as Error);
    }
}

/**
 * Get fields needing GDD update
 */
export async function getFieldsNeedingGDDUpdate() {
    try {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        return await prisma.field.findMany({
            where: {
                cropConfirmed: true,
                sowingDate: { not: null },
                OR: [
                    { lastGDDUpdate: null },
                    { lastGDDUpdate: { lt: oneDayAgo } },
                ],
            },
        });
    } catch (error) {
        throw new DatabaseError('getFieldsNeedingGDDUpdate', error as Error);
    }
}

// In src/repositories/field.repository.ts - ADD this function

/**
 * Update field (generic update)
 */
export async function updateField(
    nodeId: number,
    updates: {
        fieldName?: string;
        latitude?: number;
        longitude?: number;
        soilTexture?: string;
        location?: string;
    }
) {
    try {
        // Only include fields that are actually defined
        const updateData: Record<string, string | number> = {};

        if (updates.fieldName !== undefined) updateData.fieldName = updates.fieldName;
        if (updates.latitude !== undefined) updateData.latitude = updates.latitude;
        if (updates.longitude !== undefined) updateData.longitude = updates.longitude;
        if (updates.soilTexture !== undefined) updateData.soilTexture = updates.soilTexture;
        if (updates.location !== undefined) updateData.location = updates.location;

        return await prisma.field.update({
            where: { nodeId },
            data: updateData as any,
        });
    } catch (error) {
        throw new DatabaseError('updateField', error as Error);
    }
}


/**
 * Delete field
 */
export async function deleteField(nodeId: number) {
    try {
        return await prisma.field.delete({
            where: { nodeId },
        });
    } catch (error) {
        throw new DatabaseError('deleteField', error as Error);
    }
}
