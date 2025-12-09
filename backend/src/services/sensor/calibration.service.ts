// src/services/sensor/calibration.service.ts
/**
 * Sensor Calibration Service
 * Converts raw sensor values to VWC and temperature
 */

import type { SoilTexture } from '../../utils/constants.js';

/**
 * Calibration curves for soil moisture (SMU to VWC%)
 * Source: Laboratory calibration data for UP soils
 */
const CALIBRATION_CURVES: Record<SoilTexture, Array<{ smu: number; vwc: number }>> = {
    SANDY: [
        { smu: 0, vwc: 0 },
        { smu: 200, vwc: 5 },
        { smu: 400, vwc: 10 },
        { smu: 600, vwc: 15 },
        { smu: 800, vwc: 20 },
        { smu: 1023, vwc: 25 },
    ],
    SANDY_LOAM: [
        { smu: 0, vwc: 0 },
        { smu: 250, vwc: 8 },
        { smu: 500, vwc: 18 },
        { smu: 750, vwc: 28 },
        { smu: 1023, vwc: 35 },
    ],
    LOAM: [
        { smu: 0, vwc: 0 },
        { smu: 300, vwc: 12 },
        { smu: 600, vwc: 25 },
        { smu: 900, vwc: 38 },
        { smu: 1023, vwc: 42 },
    ],
    CLAY_LOAM: [
        { smu: 0, vwc: 0 },
        { smu: 350, vwc: 15 },
        { smu: 700, vwc: 32 },
        { smu: 1023, vwc: 45 },
    ],
    CLAY: [
        { smu: 0, vwc: 0 },
        { smu: 400, vwc: 18 },
        { smu: 800, vwc: 38 },
        { smu: 1023, vwc: 50 },
    ],
};

/**
 * Convert SMU to VWC using piecewise linear interpolation
 */
export function convertToVWC(smu: number, soilTexture: SoilTexture): number {
    const curve = CALIBRATION_CURVES[soilTexture];

    // Clamp input
    const clampedSMU = Math.max(0, Math.min(1023, smu));

    // Find surrounding points
    for (let i = 0; i < curve.length - 1; i++) {
        const p1 = curve[i];
        const p2 = curve[i + 1];

        if (p1 && p2 && clampedSMU >= p1.smu && clampedSMU <= p2.smu) {
            // Linear interpolation
            const ratio = (clampedSMU - p1.smu) / (p2.smu - p1.smu);
            const vwc = p1.vwc + ratio * (p2.vwc - p1.vwc);
            return Number(vwc.toFixed(2));
        }
    }

    // Fallback (shouldn't reach here)
    return curve[curve.length - 1]?.vwc ?? 0;
}

/**
 * Convert SMU to VWC (alias for backward compatibility)
 */
export function convertSMUtoVWC(smu: number, soilTexture: SoilTexture): number {
    return convertToVWC(smu, soilTexture);
}

/**
 * Convert raw temperature value to Celsius
 * Assuming linear ADC: temp_raw proportional to voltage
 * Adjust formula based on your actual sensor
 */
export function convertToTemperature(tempRaw: number): number {
    // Example: DHT22-style conversion (adjust for your sensor)
    // Assuming tempRaw is already in Celsius × 10
    const celsius = tempRaw / 10;
    return Number(celsius.toFixed(2));
}
