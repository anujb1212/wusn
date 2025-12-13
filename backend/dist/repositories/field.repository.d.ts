/**
 * Field Repository
 */
import { GrowthStage } from '@prisma/client';
import type { SoilTexture } from '@prisma/client';
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
    cropType: string;
    sowingDate: Date;
    baseTemperature: number;
    expectedGDDTotal: number;
    expectedHarvestDate?: Date | undefined;
}
export interface UpdateFieldInput {
    fieldName?: string;
    latitude?: number;
    longitude?: number;
    soilTexture?: SoilTexture;
    location?: string | null;
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
    soilTexture: import(".prisma/client").$Enums.SoilTexture;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    cropConfirmed: boolean;
    accumulatedGDD: number;
    lastGDDUpdate: Date | null;
    currentGrowthStage: import(".prisma/client").$Enums.GrowthStage | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    lastIrrigationCheck: Date | null;
    lastIrrigationAction: Date | null;
    createdAt: Date;
    updatedAt: Date;
    cropType: string | null;
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
    soilTexture: import(".prisma/client").$Enums.SoilTexture;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    cropConfirmed: boolean;
    accumulatedGDD: number;
    lastGDDUpdate: Date | null;
    currentGrowthStage: import(".prisma/client").$Enums.GrowthStage | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    lastIrrigationCheck: Date | null;
    lastIrrigationAction: Date | null;
    createdAt: Date;
    updatedAt: Date;
    cropType: string | null;
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
    soilTexture: import(".prisma/client").$Enums.SoilTexture;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    cropConfirmed: boolean;
    accumulatedGDD: number;
    lastGDDUpdate: Date | null;
    currentGrowthStage: import(".prisma/client").$Enums.GrowthStage | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    lastIrrigationCheck: Date | null;
    lastIrrigationAction: Date | null;
    createdAt: Date;
    updatedAt: Date;
    cropType: string | null;
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
    soilTexture: import(".prisma/client").$Enums.SoilTexture;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    cropConfirmed: boolean;
    accumulatedGDD: number;
    lastGDDUpdate: Date | null;
    currentGrowthStage: import(".prisma/client").$Enums.GrowthStage | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    lastIrrigationCheck: Date | null;
    lastIrrigationAction: Date | null;
    createdAt: Date;
    updatedAt: Date;
    cropType: string | null;
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
    soilTexture: import(".prisma/client").$Enums.SoilTexture;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    cropConfirmed: boolean;
    accumulatedGDD: number;
    lastGDDUpdate: Date | null;
    currentGrowthStage: import(".prisma/client").$Enums.GrowthStage | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    lastIrrigationCheck: Date | null;
    lastIrrigationAction: Date | null;
    createdAt: Date;
    updatedAt: Date;
    cropType: string | null;
}>;
/**
 * Update field GDD status
 */
export declare function updateFieldGDD(nodeId: number, accumulatedGDD: number, growthStage: GrowthStage): Promise<{
    id: number;
    nodeId: number;
    gatewayId: string;
    fieldName: string;
    location: string | null;
    latitude: number;
    longitude: number;
    soilTexture: import(".prisma/client").$Enums.SoilTexture;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    cropConfirmed: boolean;
    accumulatedGDD: number;
    lastGDDUpdate: Date | null;
    currentGrowthStage: import(".prisma/client").$Enums.GrowthStage | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    lastIrrigationCheck: Date | null;
    lastIrrigationAction: Date | null;
    createdAt: Date;
    updatedAt: Date;
    cropType: string | null;
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
    soilTexture: import(".prisma/client").$Enums.SoilTexture;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    cropConfirmed: boolean;
    accumulatedGDD: number;
    lastGDDUpdate: Date | null;
    currentGrowthStage: import(".prisma/client").$Enums.GrowthStage | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    lastIrrigationCheck: Date | null;
    lastIrrigationAction: Date | null;
    createdAt: Date;
    updatedAt: Date;
    cropType: string | null;
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
    soilTexture: import(".prisma/client").$Enums.SoilTexture;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    cropConfirmed: boolean;
    accumulatedGDD: number;
    lastGDDUpdate: Date | null;
    currentGrowthStage: import(".prisma/client").$Enums.GrowthStage | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    lastIrrigationCheck: Date | null;
    lastIrrigationAction: Date | null;
    createdAt: Date;
    updatedAt: Date;
    cropType: string | null;
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
    soilTexture: import(".prisma/client").$Enums.SoilTexture;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    cropConfirmed: boolean;
    accumulatedGDD: number;
    lastGDDUpdate: Date | null;
    currentGrowthStage: import(".prisma/client").$Enums.GrowthStage | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    lastIrrigationCheck: Date | null;
    lastIrrigationAction: Date | null;
    createdAt: Date;
    updatedAt: Date;
    cropType: string | null;
}[]>;
/**
 * Update field (generic update)
 */
export declare function updateField(nodeId: number, updates: UpdateFieldInput): Promise<{
    id: number;
    nodeId: number;
    gatewayId: string;
    fieldName: string;
    location: string | null;
    latitude: number;
    longitude: number;
    soilTexture: import(".prisma/client").$Enums.SoilTexture;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    cropConfirmed: boolean;
    accumulatedGDD: number;
    lastGDDUpdate: Date | null;
    currentGrowthStage: import(".prisma/client").$Enums.GrowthStage | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    lastIrrigationCheck: Date | null;
    lastIrrigationAction: Date | null;
    createdAt: Date;
    updatedAt: Date;
    cropType: string | null;
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
    soilTexture: import(".prisma/client").$Enums.SoilTexture;
    sowingDate: Date | null;
    expectedHarvestDate: Date | null;
    cropConfirmed: boolean;
    accumulatedGDD: number;
    lastGDDUpdate: Date | null;
    currentGrowthStage: import(".prisma/client").$Enums.GrowthStage | null;
    baseTemperature: number | null;
    expectedGDDTotal: number | null;
    lastIrrigationCheck: Date | null;
    lastIrrigationAction: Date | null;
    createdAt: Date;
    updatedAt: Date;
    cropType: string | null;
}>;
//# sourceMappingURL=field.repository.d.ts.map