// src/repositories/field.repository.ts
/**
 * Field Configuration Repository
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { DatabaseError, NotFoundError } from '../utils/errors.js';
import type { SoilTexture, UPCropName } from '../utils/constants.js';

export interface CreateFieldConfigInput {
    nodeId: number;
    fieldName: string;
    soilTexture: SoilTexture;
    latitude?: number | undefined; // ADD | undefined explicitly
    longitude?: number | undefined; // ADD | undefined explicitly
}

export interface UpdateFieldConfigInput {
    fieldName?: string | undefined;
    cropType?: UPCropName | null | undefined;
    sowingDate?: Date | null | undefined;
    soilTexture?: SoilTexture | undefined;
    baseTemperature?: number | null | undefined;
    expectedGDDTotal?: number | null | undefined;
    latitude?: number | null | undefined;
    longitude?: number | null | undefined;
}

/**
 * Create field config
 */
export async function createFieldConfig(input: CreateFieldConfigInput) {
    try {
        const data: Prisma.FieldConfigCreateInput = {
            nodeId: input.nodeId,
            fieldName: input.fieldName,
            soilTexture: input.soilTexture,
            latitude: input.latitude ?? null,
            longitude: input.longitude ?? null,
        };

        return await prisma.fieldConfig.create({ data });
    } catch (error) {
        throw new DatabaseError('createFieldConfig', error as Error);
    }
}

/**
 * Get field config by nodeId
 */
export async function getFieldConfigByNodeId(nodeId: number) {
    try {
        return await prisma.fieldConfig.findUnique({
            where: { nodeId },
        });
    } catch (error) {
        throw new DatabaseError('getFieldConfigByNodeId', error as Error);
    }
}

/**
 * Get field config or throw
 */
export async function getFieldConfigOrThrow(nodeId: number) {
    const config = await getFieldConfigByNodeId(nodeId);
    if (!config) {
        throw new NotFoundError('FieldConfig', nodeId);
    }
    return config;
}

/**
 * Update field config
 */
export async function updateFieldConfig(nodeId: number, input: UpdateFieldConfigInput) {
    try {
        const data: Prisma.FieldConfigUpdateInput = {};

        if (input.fieldName !== undefined) data.fieldName = input.fieldName;
        if (input.cropType !== undefined) data.cropType = input.cropType;
        if (input.sowingDate !== undefined) data.sowingDate = input.sowingDate;
        if (input.soilTexture !== undefined) data.soilTexture = input.soilTexture;
        if (input.baseTemperature !== undefined) data.baseTemperature = input.baseTemperature;
        if (input.expectedGDDTotal !== undefined) data.expectedGDDTotal = input.expectedGDDTotal;
        if (input.latitude !== undefined) data.latitude = input.latitude;
        if (input.longitude !== undefined) data.longitude = input.longitude;

        return await prisma.fieldConfig.update({
            where: { nodeId },
            data,
        });
    } catch (error) {
        throw new DatabaseError('updateFieldConfig', error as Error);
    }
}

/**
 * Get all field configs
 */
export async function getAllFieldConfigs() {
    try {
        return await prisma.fieldConfig.findMany({
            orderBy: { nodeId: 'asc' },
        });
    } catch (error) {
        throw new DatabaseError('getAllFieldConfigs', error as Error);
    }
}

/**
 * Delete field config
 */
export async function deleteFieldConfig(nodeId: number) {
    try {
        return await prisma.fieldConfig.delete({
            where: { nodeId },
        });
    } catch (error) {
        throw new DatabaseError('deleteFieldConfig', error as Error);
    }
}
