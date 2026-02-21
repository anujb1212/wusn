import { z } from 'zod';
import * as fieldRepo from '../repositories/field.repository.js';
import { NotFoundError } from '../utils/errors.js';
/**
 * Helpers
 */
function normalizeSoilTexture(v) {
    if (typeof v !== 'string')
        return v;
    return v.trim().toUpperCase();
}
/**
 * Normalize crop input to canonical IDs stored in DB:
 * - trim
 * - lower-case
 * - convert spaces/hyphens to underscore
 *
 * Final validation is done by checking existence in CropParameters table.
 */
function normalizeCropType(v) {
    if (typeof v !== 'string')
        return v;
    return v
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');
}
/**
 * Zod schemas
 */
const nodeIdSchema = z.object({
    nodeId: z.coerce.number().int().positive(),
});
const soilTextureSchema = z.preprocess(normalizeSoilTexture, z.enum(['SANDY', 'SANDY_LOAM', 'LOAM', 'CLAY_LOAM', 'CLAY']));
const createFieldSchema = z.object({
    nodeId: z.coerce.number().int().positive(),
    gatewayId: z.string().min(1),
    fieldName: z.string().min(1),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    soilTexture: soilTextureSchema,
    location: z.string().optional(),
});
const updateFieldSchema = z.object({
    fieldName: z.string().min(1).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    soilTexture: soilTextureSchema.optional(),
    location: z.string().optional(),
});
const setCropSchema = z.object({
    cropType: z.preprocess(normalizeCropType, z.string().min(1).max(64)),
    sowingDate: z.coerce.date(),
});
/**
 * POST /api/fields
 */
export async function createFieldController(req, res) {
    const data = createFieldSchema.parse(req.body);
    const field = await fieldRepo.createField({
        ...data,
        soilTexture: data.soilTexture,
    });
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
    if (!field) {
        throw new NotFoundError('Field', `nodeId=${nodeId}`);
    }
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
    // Reject empty patch (prevents accidental no-op + confusing client behavior)
    if (updates.fieldName === undefined &&
        updates.latitude === undefined &&
        updates.longitude === undefined &&
        updates.soilTexture === undefined &&
        updates.location === undefined) {
        res.status(400).json({
            status: 'error',
            message: 'No valid fields provided to update.',
            timestamp: new Date().toISOString(),
        });
        return;
    }
    // Keep your existing pattern (direct Prisma usage) but avoid narrowing issues.
    const { prisma } = await import('../config/database.js');
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
 * DB-driven validation: cropType must exist in CropParameters.cropName (validForUP=true).
 */
export async function setCropController(req, res) {
    const { nodeId } = nodeIdSchema.parse(req.params);
    const { cropType, sowingDate } = setCropSchema.parse(req.body);
    const { prisma } = await import('../config/database.js');
    const crop = await prisma.cropParameters.findUnique({
        where: { cropName: cropType },
    });
    if (!crop || crop.validForUP !== true) {
        res.status(400).json({
            status: 'error',
            message: `Invalid cropType "${cropType}". Use GET /api/crops to fetch valid crop values.`,
            timestamp: new Date().toISOString(),
        });
        return;
    }
    const field = await fieldRepo.updateFieldCrop(nodeId, {
        cropType: crop.cropName,
        sowingDate,
        baseTemperature: crop.baseTemperature,
        expectedGDDTotal: crop.lateSeasonGDD,
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