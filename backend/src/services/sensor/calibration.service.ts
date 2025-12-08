// src/services/sensor/calibration.service.ts
/**
 * Sensor Calibration Service
 */

import { SOIL_WATER_CONSTANTS } from '../../utils/constants.js';
import type { SoilTexture } from '../../utils/constants.js';

/**
 * Calibration curves per soil texture
 */
const CALIBRATION_CURVES: Record<SoilTexture, {
    smuAtWP: number;
    smuAtFC: number;
    smuAtSat: number;
}> = {
    SANDY: {
        smuAtWP: 200,
        smuAtFC: 600,
        smuAtSat: 850,
    },
    SANDY_LOAM: {
        smuAtWP: 250,
        smuAtFC: 680,
        smuAtSat: 900,
    },
    LOAM: {
        smuAtWP: 280,
        smuAtFC: 720,
        smuAtSat: 920,
    },
    CLAY_LOAM: {
        smuAtWP: 350,
        smuAtFC: 800,
        smuAtSat: 950,
    },
    CLAY: {
        smuAtWP: 400,
        smuAtFC: 850,
        smuAtSat: 980,
    },
};

/**
 * Convert SMU to VWC%
 */
export function convertSMUtoVWC(smu: number, soilTexture: SoilTexture): number {
    const clampedSMU = Math.max(0, Math.min(1023, smu));

    const curve = CALIBRATION_CURVES[soilTexture];

    // Use type assertion with fallback
    const constantsKey = soilTexture in SOIL_WATER_CONSTANTS
        ? soilTexture
        : 'SANDY_LOAM';

    const constants = SOIL_WATER_CONSTANTS[constantsKey as keyof typeof SOIL_WATER_CONSTANTS];

    const { smuAtWP, smuAtFC, smuAtSat } = curve;
    const { WILTING_POINT, FIELD_CAPACITY, SATURATION } = constants;

    let vwc: number;

    if (clampedSMU <= smuAtWP) {
        vwc = (clampedSMU / smuAtWP) * WILTING_POINT;
    } else if (clampedSMU <= smuAtFC) {
        const ratio = (clampedSMU - smuAtWP) / (smuAtFC - smuAtWP);
        vwc = WILTING_POINT + ratio * (FIELD_CAPACITY - WILTING_POINT);
    } else if (clampedSMU <= smuAtSat) {
        const ratio = (clampedSMU - smuAtFC) / (smuAtSat - smuAtFC);
        vwc = FIELD_CAPACITY + ratio * (SATURATION - FIELD_CAPACITY);
    } else {
        vwc = SATURATION;
    }

    return Number(vwc.toFixed(2));
}

/**
 * Convert temperature to Celsius
 */
export function convertTemperatureToCelsius(rawTemp: number): number {
    return Number(rawTemp.toFixed(2));
}

/**
 * Validate SMU
 */
export function isValidSMU(smu: number): boolean {
    return smu >= 0 && smu <= 1023;
}

/**
 * Validate temperature
 */
export function isValidTemperature(temp: number): boolean {
    return temp >= -10 && temp <= 60;
}
