import { z } from 'zod';
import * as fieldRepo from '../repositories/field.repository.js';
import { VALID_CROPS, CROP_DATABASE } from '../utils/constants.js';
const createFieldSchema = z.object({
    nodeId: z.number().int().positive(),
    gatewayId: z.string().min(1),
    fieldName: z.string().min(1),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    soilTexture: z.enum(['SANDY', 'SANDY_LOAM', 'LOAM', 'CLAY_LOAM', 'CLAY']),
    location: z.string().optional(),
});
const updateFieldSchema = z.object({
    fieldName: z.string().min(1).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    soilTexture: z.enum(['SANDY', 'SANDY_LOAM', 'LOAM', 'CLAY_LOAM', 'CLAY']).optional(),
    location: z.string().optional(),
});
//  Uses VALID_CROPS from constants (9 crops only)
const setCropSchema = z.object({
    cropType: z.enum(VALID_CROPS),
    sowingDate: z.string().datetime(),
});
const nodeIdSchema = z.object({
    nodeId: z.coerce.number().int().positive(),
});
/**
 * POST /api/fields
 */
export async function createFieldController(req, res) {
    const data = createFieldSchema.parse(req.body);
    const field = await fieldRepo.createField(data);
    res.status(201).json({
        status: 'ok',
        data: field,
        timestamp: new Date().toISOString(),
    });
}
/**
 * GET /api/fields/:nodeId
 */
export async function getFieldController(req, res) {
    const { nodeId } = nodeIdSchema.parse(req.params);
    const field = await fieldRepo.getFieldByNodeId(nodeId);
    res.json({
        status: 'ok',
        data: field,
        timestamp: new Date().toISOString(),
    });
}
/**
 * GET /api/fields
 */
export async function getAllFieldsController(_req, res) {
    const fields = await fieldRepo.getAllFields();
    res.json({
        status: 'ok',
        data: fields,
        timestamp: new Date().toISOString(),
    });
}
/**
 * PATCH /api/fields/:nodeId
 */
export async function updateFieldController(req, res) {
    const { nodeId } = nodeIdSchema.parse(req.params);
    const updates = updateFieldSchema.parse(req.body);
    const { prisma } = await import('../config/database.js');
    // Only include fields that were actually provided (not undefined)
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
    const field = await prisma.field.update({
        where: { nodeId },
        data: updateData,
    });
    res.json({
        status: 'ok',
        data: field,
        timestamp: new Date().toISOString(),
    });
}
/**
 * POST /api/fields/:nodeId/crop
 * ✅ FIXED: Only accepts 9 crops from UP_VALID_CROPS
 */
export async function setCropController(req, res) {
    const { nodeId } = nodeIdSchema.parse(req.params);
    const { cropType, sowingDate } = setCropSchema.parse(req.body);
    // Type assertion for cropType - guaranteed valid by Zod
    const validCropType = cropType;
    // ✅ Validate crop exists in CROP_DATABASE
    const cropParams = CROP_DATABASE[validCropType];
    if (!cropParams) {
        res.status(400).json({
            status: 'error',
            message: `Crop ${cropType} not found in database`,
            timestamp: new Date().toISOString(),
        });
        return;
    }
    const field = await fieldRepo.updateFieldCrop(nodeId, {
        cropType: validCropType,
        sowingDate: new Date(sowingDate),
        baseTemperature: cropParams.baseTemp,
        expectedGDDTotal: cropParams.lateSeasonGDD,
    });
    res.json({
        status: 'ok',
        data: field,
        timestamp: new Date().toISOString(),
    });
}
/**
 * DELETE /api/fields/:nodeId
 */
export async function deleteFieldController(req, res) {
    const { nodeId } = nodeIdSchema.parse(req.params);
    const { prisma } = await import('../config/database.js');
    await prisma.field.delete({
        where: { nodeId },
    });
    res.json({
        status: 'ok',
        data: { nodeId, deleted: true },
        timestamp: new Date().toISOString(),
    });
}
//# sourceMappingURL=fieldController.js.map