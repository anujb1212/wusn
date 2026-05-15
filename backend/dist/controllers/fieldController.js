import { z } from 'zod';
import * as fieldRepo from '../repositories/field.repository.js';
function normalizeSoilTexture(v) {
    if (typeof v !== 'string')
        return v;
    return v.trim().toUpperCase();
}
function normalizeCropType(v) {
    if (typeof v !== 'string')
        return v;
    return v
        .trim()
        .toLowerCase()
        .replace(/[\s-]+/g, '_');
}
// Zod schemas
const fieldIdSchema = z.object({
    fieldId: z.coerce.number().int().positive(),
});
// For assign node to field
const nodeIdParamSchema = z.object({
    nodeId: z.coerce.number().int().positive(),
});
const soilTextureSchema = z.preprocess(normalizeSoilTexture, z.enum(['SANDY', 'SANDY_LOAM', 'LOAM', 'CLAY_LOAM', 'CLAY']));
const createFieldSchema = z.object({
    gatewayId: z.string().min(1).optional().default("gateway-1"),
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
// POST /api/fields
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
// GET /api/fields/:fieldId
export async function getFieldController(req, res) {
    const { fieldId } = fieldIdSchema.parse(req.params);
    const field = await fieldRepo.getFieldById(fieldId);
    res.json({
        status: 'ok',
        data: field,
        timestamp: new Date().toISOString(),
    });
}
// GET /api/fields
export async function getAllFieldsController(_req, res) {
    const fields = await fieldRepo.getAllFields();
    const safeFields = fields.map((f) => ({
        ...f,
        createdAt: f.createdAt ?? new Date().toISOString(),
    }));
    res.json({
        status: 'ok',
        data: safeFields,
        timestamp: new Date().toISOString(),
    });
}
// PATCH /api/fields/:fieldId
export async function updateFieldController(req, res) {
    const { fieldId } = fieldIdSchema.parse(req.params);
    const updates = updateFieldSchema.parse(req.body);
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
    const field = await fieldRepo.updateField(fieldId, updates);
    res.json({
        status: 'ok',
        data: field,
        timestamp: new Date().toISOString(),
    });
}
// POST /api/fields/:fieldId/crop
export async function setCropController(req, res) {
    const { fieldId } = fieldIdSchema.parse(req.params);
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
    const field = await fieldRepo.updateFieldCrop(fieldId, {
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
//POST /api/fields/:fieldId/harvest
export async function harvestCropController(req, res) {
    const { fieldId } = fieldIdSchema.parse(req.params);
    const { prisma } = await import('../config/database.js');
    const field = await fieldRepo.getFieldById(fieldId);
    if (!field.cropConfirmed) {
        res.status(400).json({
            success: false,
            error: `No confirmed crop on fieldId=${fieldId}. Confirm crop before harvesting.`,
            timestamp: new Date().toISOString(),
        });
        return;
    }
    const updated = await prisma.field.update({
        where: { id: fieldId },
        data: {
            cropType: null,
            sowingDate: null,
            cropConfirmed: false,
            accumulatedGDD: 0,
            currentGrowthStage: 'INITIAL',
            lastGDDUpdate: null,
            expectedHarvestDate: null,
            lastIrrigationCheck: null,
        },
    });
    res.json({
        success: true,
        data: updated,
        timestamp: new Date().toISOString(),
    });
}
// DELETE /api/fields/:fieldId
export async function deleteFieldController(req, res) {
    const { fieldId } = fieldIdSchema.parse(req.params);
    await fieldRepo.deleteField(fieldId);
    res.json({
        status: 'ok',
        data: {
            fieldId,
            deleted: true
        },
        timestamp: new Date().toISOString(),
    });
}
// POST /api/fields/:fieldId/nodes/:nodeId
export async function assignNodeToFieldController(req, res) {
    const { fieldId } = fieldIdSchema.parse(req.params);
    const { nodeId } = nodeIdParamSchema.parse(req.params);
    // Verify field exists
    await fieldRepo.getFieldById(fieldId);
    const node = await fieldRepo.assignNodeToField(nodeId, fieldId);
    res.json({
        status: 'ok',
        data: node,
        timestamp: new Date().toISOString(),
    });
}
// GET /api/fields/:fieldId/nodes
export async function getFieldNodesController(req, res) {
    const { fieldId } = fieldIdSchema.parse(req.params);
    const nodes = await fieldRepo.getFieldNodes(fieldId);
    res.json({
        status: 'ok',
        data: nodes,
        timestamp: new Date().toISOString(),
    });
}
//# sourceMappingURL=fieldController.js.map