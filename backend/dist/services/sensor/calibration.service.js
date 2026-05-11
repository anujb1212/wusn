/**
  * Sensor Calibration Service
  *
  * Current gateway sends pre-calibrated VWC% directly.
  * convertRawADCToVWC() is reserved for future hardware using raw ADC (0-1023).
  * CALIBRATION_CURVES are validated for UP soil types (SANDY → CLAY).
  */
/**
 * ADVANCED CALIBRATION (Future Enhancement)
 *
 * If you later want to use raw ADC values (0-1023) from actual sensor hardware,
 * uncomment and use these calibration curves instead.
 */
const CALIBRATION_CURVES = {
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
export function convertRawADCToVWC(smu, soilTexture) {
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
//# sourceMappingURL=calibration.service.js.map