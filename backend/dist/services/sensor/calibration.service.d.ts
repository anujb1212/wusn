/**
  * Sensor Calibration Service
  *
  * Current gateway sends pre-calibrated VWC% directly.
  * convertRawADCToVWC() is reserved for future hardware using raw ADC (0-1023).
  * CALIBRATION_CURVES are validated for UP soil types (SANDY → CLAY).
  */
import type { SoilTexture } from '../../utils/constants.js';
export declare function convertRawADCToVWC(smu: number, soilTexture: SoilTexture): number;
//# sourceMappingURL=calibration.service.d.ts.map