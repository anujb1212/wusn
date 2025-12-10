/**
 * Sensor Calibration Service
 * Converts sensor values to VWC and temperature
 *
 * MQTT Protocol: Sensors send pre-scaled values
 * - moisture: 0-1000 representing 0.0-100.0% VWC
 * - temperature: value * 10 (e.g., 285 = 28.5°C)
 */
import type { SoilTexture } from '../../utils/constants.js';
/**
 * Convert moisture value to VWC percentage
 *
 * @param moisture - Pre-scaled moisture value (0-1000 = 0-100% VWC)
 * @param soilTexture - Soil type (kept for future calibration refinements)
 * @returns VWC as percentage (0-100)
 */
export declare function convertToVWC(moisture: number, soilTexture: SoilTexture): number;
/**
 * Alias for backward compatibility
 */
export declare function convertSMUtoVWC(smu: number, soilTexture: SoilTexture): number;
/**
 * Convert raw temperature value to Celsius
 *
 * @param tempRaw - Temperature value * 10 (e.g., 285 = 28.5°C)
 * @returns Temperature in Celsius
 */
export declare function convertToTemperature(tempRaw: number): number;
export declare function convertRawADCToVWC(smu: number, soilTexture: SoilTexture): number;
//# sourceMappingURL=calibration.service.d.ts.map