// src/repositories/field.repository.ts
/**
 * Field Repository
 */
import { Prisma, GrowthStage } from '@prisma/client';
import { prisma } from '../config/database.js';
import { DatabaseError, NotFoundError } from '../utils/errors.js';
function isPrismaNotFound(error) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}
/**
 * Create field
 */
export async function createField(input) {
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
    }
    catch (error) {
        throw new DatabaseError('createField', error);
    }
}
/**
 * Get field by node ID
 */
export async function getFieldByNodeId(nodeId) {
    try {
        const field = await prisma.field.findUnique({
            where: { nodeId },
        });
        if (!field) {
            throw new NotFoundError('Field', `nodeId=${nodeId}`);
        }
        return field;
    }
    catch (error) {
        if (error instanceof NotFoundError)
            throw error;
        throw new DatabaseError('getFieldByNodeId', error);
    }
}
/**
 * Get field by ID
 */
export async function getFieldById(id) {
    try {
        const field = await prisma.field.findUnique({
            where: { id },
        });
        if (!field) {
            throw new NotFoundError('Field', `id=${id}`);
        }
        return field;
    }
    catch (error) {
        if (error instanceof NotFoundError)
            throw error;
        throw new DatabaseError('getFieldById', error);
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
    }
    catch (error) {
        throw new DatabaseError('getAllFields', error);
    }
}
/**
 * Update field crop configuration
 */
export async function updateFieldCrop(nodeId, input) {
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
                // Reset runtime state on crop change
                accumulatedGDD: 0,
                currentGrowthStage: GrowthStage.INITIAL,
                lastGDDUpdate: null,
            },
        });
    }
    catch (error) {
        if (isPrismaNotFound(error)) {
            throw new NotFoundError('Field', `nodeId=${nodeId}`);
        }
        throw new DatabaseError('updateFieldCrop', error);
    }
}
/**
 * Update field GDD status
 */
export async function updateFieldGDD(nodeId, accumulatedGDD, growthStage) {
    try {
        return await prisma.field.update({
            where: { nodeId },
            data: {
                accumulatedGDD,
                currentGrowthStage: growthStage,
                lastGDDUpdate: new Date(),
            },
        });
    }
    catch (error) {
        if (isPrismaNotFound(error)) {
            throw new NotFoundError('Field', `nodeId=${nodeId}`);
        }
        throw new DatabaseError('updateFieldGDD', error);
    }
}
/**
 * Update last irrigation check
 */
export async function updateLastIrrigationCheck(nodeId) {
    try {
        return await prisma.field.update({
            where: { nodeId },
            data: {
                lastIrrigationCheck: new Date(),
            },
        });
    }
    catch (error) {
        if (isPrismaNotFound(error)) {
            throw new NotFoundError('Field', `nodeId=${nodeId}`);
        }
        throw new DatabaseError('updateLastIrrigationCheck', error);
    }
}
/**
 * Record irrigation action
 */
export async function recordIrrigationAction(nodeId) {
    try {
        return await prisma.field.update({
            where: { nodeId },
            data: {
                lastIrrigationAction: new Date(),
            },
        });
    }
    catch (error) {
        if (isPrismaNotFound(error)) {
            throw new NotFoundError('Field', `nodeId=${nodeId}`);
        }
        throw new DatabaseError('recordIrrigationAction', error);
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
                OR: [{ lastGDDUpdate: null }, { lastGDDUpdate: { lt: oneDayAgo } }],
            },
        });
    }
    catch (error) {
        throw new DatabaseError('getFieldsNeedingGDDUpdate', error);
    }
}
/**
 * Update field (generic update)
 */
export async function updateField(nodeId, updates) {
    try {
        const data = {};
        if (updates.fieldName !== undefined)
            data.fieldName = updates.fieldName;
        if (updates.latitude !== undefined)
            data.latitude = updates.latitude;
        if (updates.longitude !== undefined)
            data.longitude = updates.longitude;
        if (updates.soilTexture !== undefined)
            data.soilTexture = updates.soilTexture;
        if (updates.location !== undefined)
            data.location = updates.location;
        return await prisma.field.update({
            where: { nodeId },
            data,
        });
    }
    catch (error) {
        if (isPrismaNotFound(error)) {
            throw new NotFoundError('Field', `nodeId=${nodeId}`);
        }
        throw new DatabaseError('updateField', error);
    }
}
/**
 * Delete field
 */
export async function deleteField(nodeId) {
    try {
        return await prisma.field.delete({
            where: { nodeId },
        });
    }
    catch (error) {
        if (isPrismaNotFound(error)) {
            throw new NotFoundError('Field', `nodeId=${nodeId}`);
        }
        throw new DatabaseError('deleteField', error);
    }
}
//# sourceMappingURL=field.repository.js.map