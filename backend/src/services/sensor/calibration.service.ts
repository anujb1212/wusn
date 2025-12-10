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
export function convertToVWC(moisture: number, soilTexture: SoilTexture): number {
    // ✅ Direct conversion: MQTT sends pre-calibrated values
    // Format: 0-1000 representing 0.0% to 100.0% VWC
    // Examples:
    //   380 → 38.0% (rice optimal)
    //   250 → 25.0% (wheat optimal)
    //   150 → 15.0% (dry, needs water)

    const vwc = moisture / 10;

    // Clamp to valid range and round to 1 decimal
    return Math.max(0, Math.min(100, Number(vwc.toFixed(1))));
}

/**
 * Alias for backward compatibility
 */
export function convertSMUtoVWC(smu: number, soilTexture: SoilTexture): number {
    return convertToVWC(smu, soilTexture);
}

/**
 * Convert raw temperature value to Celsius
 * 
 * @param tempRaw - Temperature value * 10 (e.g., 285 = 28.5°C)
 * @returns Temperature in Celsius
 */
export function convertToTemperature(tempRaw: number): number {
    // ✅ MQTT format: temperature * 10
    // Examples:
    //   285 → 28.5°C
    //   220 → 22.0°C
    //   30 → 3.0°C

    const celsius = tempRaw / 10;

    // Clamp to reasonable range and round to 1 decimal
    return Math.max(-10, Math.min(60, Number(celsius.toFixed(1))));
}

/**
 * ADVANCED CALIBRATION (Future Enhancement)
 * 
 * If you later want to use raw ADC values (0-1023) from actual sensor hardware,
 * uncomment and use these calibration curves instead.
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

export function convertRawADCToVWC(smu: number, soilTexture: SoilTexture): number {
    const curve = CALIBRATION_CURVES[soilTexture];
    const clampedSMU = Math.max(0, Math.min(1023, smu));

    for (let i = 0; i < curve.length - 1; i++) {
        const p1 = curve[i];
        const p2 = curve[i + 1];

        if (p1 && p2 && clampedSMU >= p1.smu && clampedSMU <= p2.smu) {
            const ratio = (clampedSMU - p1.smu) / (p2.smu - p1.smu);
            const vwc = p1.vwc + ratio * (p2.vwc - p1.vwc);
            return Number(vwc.toFixed(2));
        }
    }

    return curve[curve.length - 1]?.vwc ?? 0;
}

