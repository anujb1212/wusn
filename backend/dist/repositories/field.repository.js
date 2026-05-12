import { Prisma, GrowthStage } from '@prisma/client';
import { prisma } from '../config/database.js';
import { DatabaseError, NotFoundError } from '../utils/errors.js';
function isPrismaNotFound(error) {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}
// Create field
export async function createField(input) {
    try {
        return await prisma.field.create({
            data: {
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
// Get field by node ID
export async function getFieldByNodeId(nodeId) {
    try {
        const node = await prisma.node.findUnique({
            where: { nodeId },
            include: { field: true },
        });
        if (!node) {
            throw new NotFoundError('Node', `nodeId=${nodeId}`);
        }
        if (!node.field) {
            throw new NotFoundError('Field', `nodeId=${nodeId} (node has no assigned field)`);
        }
        return node.field;
    }
    catch (error) {
        if (error instanceof NotFoundError)
            throw error;
        throw new DatabaseError('getFieldByNodeId', error);
    }
}
// Get field by ID
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
// Get all fields
export async function getAllFields() {
    try {
        return await prisma.field.findMany({
            include: {
                nodes: {
                    select: {
                        nodeId: true,
                        isActive: true
                    }
                }
            },
            orderBy: { fieldName: 'asc' },
        });
    }
    catch (error) {
        throw new DatabaseError('getAllFields', error);
    }
}
// Update field crop configuration
export async function updateFieldCrop(fieldId, input) {
    try {
        return await prisma.field.update({
            where: { id: fieldId },
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
            throw new NotFoundError('Field', `id=${fieldId}`);
        }
        throw new DatabaseError('updateFieldCrop', error);
    }
}
// Update field GDD status
export async function updateFieldGDD(fieldId, accumulatedGDD, growthStage) {
    try {
        return await prisma.field.update({
            where: { id: fieldId },
            data: {
                accumulatedGDD,
                currentGrowthStage: growthStage,
                lastGDDUpdate: new Date(),
            },
        });
    }
    catch (error) {
        if (isPrismaNotFound(error)) {
            throw new NotFoundError('Field', `id=${fieldId}`);
        }
        throw new DatabaseError('updateFieldGDD', error);
    }
}
// Update last irrigation check
export async function updateLastIrrigationCheck(fieldId) {
    try {
        return await prisma.field.update({
            where: { id: fieldId },
            data: {
                lastIrrigationCheck: new Date(),
            },
        });
    }
    catch (error) {
        if (isPrismaNotFound(error)) {
            throw new NotFoundError('Field', `id=${fieldId}`);
        }
        throw new DatabaseError('updateLastIrrigationCheck', error);
    }
}
// Record irrigation action
export async function recordIrrigationAction(fieldId) {
    try {
        return await prisma.field.update({
            where: { id: fieldId },
            data: {
                lastIrrigationAction: new Date(),
            },
        });
    }
    catch (error) {
        if (isPrismaNotFound(error)) {
            throw new NotFoundError('Field', `id=${fieldId}`);
        }
        throw new DatabaseError('recordIrrigationAction', error);
    }
}
// Get fields needing GDD update
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
            include: {
                nodes: {
                    select: {
                        nodeId: true
                    }
                }
            },
        });
    }
    catch (error) {
        throw new DatabaseError('getFieldsNeedingGDDUpdate', error);
    }
}
// Update field (generic update)
export async function updateField(fieldId, updates) {
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
            where: { id: fieldId },
            data,
        });
    }
    catch (error) {
        if (isPrismaNotFound(error)) {
            throw new NotFoundError('Field', `id=${fieldId}`);
        }
        throw new DatabaseError('updateField', error);
    }
}
// Delete field
export async function deleteField(fieldId) {
    try {
        return await prisma.field.delete({
            where: { id: fieldId },
        });
    }
    catch (error) {
        if (isPrismaNotFound(error)) {
            throw new NotFoundError('Field', `id=${fieldId}`);
        }
        throw new DatabaseError('deleteField', error);
    }
}
// Assign node to field
export async function assignNodeToField(nodeId, fieldId) {
    try {
        return await prisma.node.update({
            where: { nodeId },
            data: { fieldId },
        });
    }
    catch (error) {
        if (isPrismaNotFound(error)) {
            throw new NotFoundError('Node', `nodeId=${nodeId}`);
        }
        throw new DatabaseError('assignNodeToField', error);
    }
}
// Get all nodes of a field
export async function getFieldNodes(fieldId) {
    try {
        return await prisma.node.findMany({
            where: { fieldId },
            orderBy: { nodeId: 'asc' },
        });
    }
    catch (error) {
        throw new DatabaseError('getFieldNodes', error);
    }
}
//# sourceMappingURL=field.repository.js.map