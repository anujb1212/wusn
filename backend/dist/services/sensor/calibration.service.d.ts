/**
 * Sensor Calibration Service
 * Converts raw sensor values to VWC and temperature
 */
import type { SoilTexture } from '../../utils/constants.js';
/**
 * Convert SMU to VWC using piecewise linear interpolation
 */
export declare function convertToVWC(smu: number, soilTexture: SoilTexture): number;
/**
 * Convert SMU to VWC (alias for backward compatibility)
 */
export declare function convertSMUtoVWC(smu: number, soilTexture: SoilTexture): number;
/**
 * Convert raw temperature value to Celsius
 * Assuming linear ADC: temp_raw proportional to voltage
 * Adjust formula based on your actual sensor
 */
export declare function convertToTemperature(tempRaw: number): number;
//# sourceMappingURL=calibration.service.d.ts.map