interface CurrentWeather {
    temp_c: number;
    humidity: number;
    description: string;
}
interface DailyForecast {
    date: string;
    temp_max_c: number;
    temp_min_c: number;
    rain_mm: number;
    description: string;
}
export interface WeatherData {
    current: CurrentWeather;
    forecast_7day: DailyForecast[];
}
/**
 * Fetch weather forecast for given coordinates (with cache)
 * @param latitude - Field latitude
 * @param longitude - Field longitude
 * @returns Weather data with current + 7-day forecast
 */
export declare function fetchWeatherWithCache(latitude: number, longitude: number): Promise<WeatherData>;
/**
 * Fetch weather forecast for given coordinates (direct, no cache)
 * @param latitude - Field latitude
 * @param longitude - Field longitude
 * @returns Weather data with current + 7-day forecast
 */
export declare function fetchWeatherForecast(latitude: number, longitude: number): Promise<WeatherData>;
/**
 * Calculate 7-day cumulative rainfall from forecast
 */
export declare function getCumulativeRainfall(weatherData: WeatherData): number;
/**
 * Get temperature range (min/max) for next 7 days
 */
export declare function getTemperatureRange(weatherData: WeatherData): {
    min: number;
    max: number;
    avg: number;
};
/**
 * Check if significant rain expected in next N days
 */
export declare function isSignificantRainExpected(weatherData: WeatherData, days?: number, thresholdMm?: number): boolean;
/**
 * Clear weather cache manually (for testing)
 */
export declare function clearWeatherCache(): void;
/**
 * Get cache statistics
 */
export declare function getCacheStats(): {
    size: number;
    keys: string[];
};
export {};
//# sourceMappingURL=weatherService.d.ts.map