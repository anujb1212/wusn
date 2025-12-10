/**
 * Weather Service - OpenWeatherMap Integration
 * Fetches 5-day forecast with caching
 */
import type { WeatherForecast } from '../../models/common.types.js';
/**
 * Get weather forecast with caching
 */
export declare function getWeatherForecast(latitude: number, longitude: number): Promise<WeatherForecast>;
/**
 * Check if significant rain is expected in forecast window
 */
export declare function isRainExpected(latitude: number, longitude: number, hoursAhead?: number, thresholdMm?: number): Promise<{
    expected: boolean;
    totalMm: number;
    description: string;
}>;
/**
 * Get simplified ET estimation using Hargreaves method
 * ET0 ≈ 0.0023 × (Tmean + 17.8) × (Tmax - Tmin)^0.5 × Ra
 * Simplified without solar radiation: ET0 ≈ 0.0135 × (Tmean + 17.8) × TD
 */
export declare function estimateDailyET(latitude: number, longitude: number): Promise<number>;
//# sourceMappingURL=weather.sevice.d.ts.map