/**
 * Field Repository
 */
import type { SoilTexture, UPCropName } from '../utils/constants.js';
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
    cropType: UPCropName;
    sowingDate: Date;
    baseTemperature: number;
    expectedGDDTotal: number;
    expectedHarvestDate?: Date | undefined;
}
/**
 * Create field
 */
export declare function createField(input: CreateFieldInput): Promise<{
    id: number;
    nodeId: number;
    gatewayId: string;
    fieldName: string;
    location: string | null;
    latitude: number;
    longitude: number;
    soilTexture: string;
    cropType: string | null;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    cropConfirmed: boolean;
    accumulatedGDD: number;
    lastGDDUpdate: Date | null;
    currentGrowthStage: string | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    lastIrrigationCheck: Date | null;
    lastIrrigationAction: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
/**
 * Get field by node ID
 */
export declare function getFieldByNodeId(nodeId: number): Promise<{
    id: number;
    nodeId: number;
    gatewayId: string;
    fieldName: string;
    location: string | null;
    latitude: number;
    longitude: number;
    soilTexture: string;
    cropType: string | null;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    cropConfirmed: boolean;
    accumulatedGDD: number;
    lastGDDUpdate: Date | null;
    currentGrowthStage: string | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    lastIrrigationCheck: Date | null;
    lastIrrigationAction: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
/**
 * Get field by ID
 */
export declare function getFieldById(id: number): Promise<{
    id: number;
    nodeId: number;
    gatewayId: string;
    fieldName: string;
    location: string | null;
    latitude: number;
    longitude: number;
    soilTexture: string;
    cropType: string | null;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    cropConfirmed: boolean;
    accumulatedGDD: number;
    lastGDDUpdate: Date | null;
    currentGrowthStage: string | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    lastIrrigationCheck: Date | null;
    lastIrrigationAction: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
/**
 * Get all fields
 */
export declare function getAllFields(): Promise<{
    id: number;
    nodeId: number;
    gatewayId: string;
    fieldName: string;
    location: string | null;
    latitude: number;
    longitude: number;
    soilTexture: string;
    cropType: string | null;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    cropConfirmed: boolean;
    accumulatedGDD: number;
    lastGDDUpdate: Date | null;
    currentGrowthStage: string | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    lastIrrigationCheck: Date | null;
    lastIrrigationAction: Date | null;
    createdAt: Date;
    updatedAt: Date;
}[]>;
/**
 * Update field crop configuration
 */
export declare function updateFieldCrop(nodeId: number, input: UpdateFieldCropInput): Promise<{
    id: number;
    nodeId: number;
    gatewayId: string;
    fieldName: string;
    location: string | null;
    latitude: number;
    longitude: number;
    soilTexture: string;
    cropType: string | null;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    cropConfirmed: boolean;
    accumulatedGDD: number;
    lastGDDUpdate: Date | null;
    currentGrowthStage: string | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    lastIrrigationCheck: Date | null;
    lastIrrigationAction: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
/**
 * Update field GDD status
 */
export declare function updateFieldGDD(nodeId: number, accumulatedGDD: number, growthStage: string): Promise<{
    id: number;
    nodeId: number;
    gatewayId: string;
    fieldName: string;
    location: string | null;
    latitude: number;
    longitude: number;
    soilTexture: string;
    cropType: string | null;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    cropConfirmed: boolean;
    accumulatedGDD: number;
    lastGDDUpdate: Date | null;
    currentGrowthStage: string | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    lastIrrigationCheck: Date | null;
    lastIrrigationAction: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
/**
 * Update last irrigation check
 */
export declare function updateLastIrrigationCheck(nodeId: number): Promise<{
    id: number;
    nodeId: number;
    gatewayId: string;
    fieldName: string;
    location: string | null;
    latitude: number;
    longitude: number;
    soilTexture: string;
    cropType: string | null;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    cropConfirmed: boolean;
    accumulatedGDD: number;
    lastGDDUpdate: Date | null;
    currentGrowthStage: string | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    lastIrrigationCheck: Date | null;
    lastIrrigationAction: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
/**
 * Record irrigation action
 */
export declare function recordIrrigationAction(nodeId: number): Promise<{
    id: number;
    nodeId: number;
    gatewayId: string;
    fieldName: string;
    location: string | null;
    latitude: number;
    longitude: number;
    soilTexture: string;
    cropType: string | null;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    cropConfirmed: boolean;
    accumulatedGDD: number;
    lastGDDUpdate: Date | null;
    currentGrowthStage: string | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    lastIrrigationCheck: Date | null;
    lastIrrigationAction: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
/**
 * Get fields needing GDD update
 */
export declare function getFieldsNeedingGDDUpdate(): Promise<{
    id: number;
    nodeId: number;
    gatewayId: string;
    fieldName: string;
    location: string | null;
    latitude: number;
    longitude: number;
    soilTexture: string;
    cropType: string | null;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    cropConfirmed: boolean;
    accumulatedGDD: number;
    lastGDDUpdate: Date | null;
    currentGrowthStage: string | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    lastIrrigationCheck: Date | null;
    lastIrrigationAction: Date | null;
    createdAt: Date;
    updatedAt: Date;
}[]>;
/**
 * Update field (generic update)
 */
export declare function updateField(nodeId: number, updates: {
    fieldName?: string;
    latitude?: number;
    longitude?: number;
    soilTexture?: string;
    location?: string;
}): Promise<{
    id: number;
    nodeId: number;
    gatewayId: string;
    fieldName: string;
    location: string | null;
    latitude: number;
    longitude: number;
    soilTexture: string;
    cropType: string | null;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    cropConfirmed: boolean;
    accumulatedGDD: number;
    lastGDDUpdate: Date | null;
    currentGrowthStage: string | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    lastIrrigationCheck: Date | null;
    lastIrrigationAction: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
/**
 * Delete field
 */
export declare function deleteField(nodeId: number): Promise<{
    id: number;
    nodeId: number;
    gatewayId: string;
    fieldName: string;
    location: string | null;
    latitude: number;
    longitude: number;
    soilTexture: string;
    cropType: string | null;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    cropConfirmed: boolean;
    accumulatedGDD: number;
    lastGDDUpdate: Date | null;
    currentGrowthStage: string | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    lastIrrigationCheck: Date | null;
    lastIrrigationAction: Date | null;
    createdAt: Date;
    updatedAt: Date;
}>;
//# sourceMappingURL=field.repository.d.ts.map