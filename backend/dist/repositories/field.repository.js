// src/repositories/field.repository.ts
/**
 * Field Repository
 */
import { prisma } from '../config/database.js';
import { DatabaseError, NotFoundError } from '../utils/errors.js';
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
                accumulatedGDD: 0, // Reset GDD on crop change
                currentGrowthStage: 'INITIAL',
                lastGDDUpdate: null,
            },
        });
    }
    catch (error) {
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
                OR: [
                    { lastGDDUpdate: null },
                    { lastGDDUpdate: { lt: oneDayAgo } },
                ],
            },
        });
    }
    catch (error) {
        throw new DatabaseError('getFieldsNeedingGDDUpdate', error);
    }
}
// In src/repositories/field.repository.ts - ADD this function
/**
 * Update field (generic update)
 */
export async function updateField(nodeId, updates) {
    try {
        // Only include fields that are actually defined
        const updateData = {};
        if (updates.fieldName !== undefined)
            updateData.fieldName = updates.fieldName;
        if (updates.latitude !== undefined)
            updateData.latitude = updates.latitude;
        if (updates.longitude !== undefined)
            updateData.longitude = updates.longitude;
        if (updates.soilTexture !== undefined)
            updateData.soilTexture = updates.soilTexture;
        if (updates.location !== undefined)
            updateData.location = updates.location;
        return await prisma.field.update({
            where: { nodeId },
            data: updateData,
        });
    }
    catch (error) {
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
        throw new DatabaseError('deleteField', error);
    }
}
//# sourceMappingURL=field.repository.js.map