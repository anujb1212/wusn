interface DailyForecast {
    date: string;
    temp_max_c: number;
    temp_min_c: number;
    precipitation_mm: number;
    humidity_pct?: number;
    wind_speed_kmh?: number;
    description: string;
}
export interface WeatherData {
    current: {
        temp_c: number;
        humidity_pct: number;
        wind_speed_kmh: number;
        condition: string;
    };
    forecast_7day: DailyForecast[];
}
/**
 * Fetch weather forecast for given coordinates (with cache)
 */
export declare function fetchWeatherWithCache(latitude: number, longitude: number): Promise<WeatherData>;
/**
 * Fetch weather forecast for given coordinates (direct, no cache)
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