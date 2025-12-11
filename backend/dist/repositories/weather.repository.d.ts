/**
 * Weather Data Repository
 *
 * Handles air temperature data aggregation from SensorReading.airTemperature
 * (gateway-provided air measurements) and external weather forecast caching.
 *
 * Note: WeatherReading table is deprecated - air measurements now part of SensorReading
 *
 * UPDATED: Dec 11, 2025 - Removed problematic null filters, handle in JavaScript
 */
/**
 * Daily air temperature aggregation result
 * Used for GDD calculations and ET estimation
 */
export interface DailyAirTempData {
    avgAirTemp: number;
    minAirTemp: number;
    maxAirTemp: number;
    readingsCount: number;
}
/**
 * Get daily air temperature statistics from sensor readings
 *
 * Queries SensorReading.airTemperature (from gateway BME280 or similar)
 * Aggregates all readings for specified date to compute min/max/avg
 *
 * Used by GDD service for daily GDD calculation:
 * GDD = max(0, (Tmax + Tmin)/2 - Tbase)
 *
 * @param gatewayId - Gateway identifier
 * @param date - Date to aggregate (time component ignored)
 * @returns DailyAirTempData or null if no readings available
 */
export declare function getDailyAverageAirTemp(gatewayId: string, date: Date): Promise<DailyAirTempData | null>;
/**
 * Get daily air temperature statistics by nodeId (alternative method)
 *
 * Simpler query when you have nodeId directly instead of gatewayId
 *
 * @param nodeId - Sensor node ID
 * @param date - Date to aggregate
 * @returns DailyAirTempData or null if no readings
 */
export declare function getDailyAirTempByNode(nodeId: number, date: Date): Promise<DailyAirTempData | null>;
/**
 * Get air temperature readings for date range
 *
 * @param nodeId - Sensor node ID
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns Array of readings with timestamps and air temperatures
 */
export declare function getAirTempReadingsForDateRange(nodeId: number, startDate: Date, endDate: Date): Promise<{
    timestamp: Date;
    airTemperature: number;
    airHumidity: number;
    airPressure: number | null;
    id: number;
    nodeId: number;
}[]>;
/**
 * Cache weather forecast from external API
 *
 * Used for rain prediction and irrigation scheduling
 *
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @param forecastData - Forecast data (JSON)
 * @param ttlHours - Time-to-live in hours
 * @returns Cached forecast record
 */
export declare function cacheWeatherForecast(latitude: number, longitude: number, forecastData: unknown, ttlHours: number): Promise<{
    id: number;
    latitude: number;
    longitude: number;
    forecastData: import("@prisma/client/runtime/library").JsonValue;
    fetchedAt: Date;
    expiresAt: Date;
}>;
/**
 * Get cached weather forecast if not expired
 *
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @returns Cached forecast or null if expired/not found
 */
export declare function getCachedWeatherForecast(latitude: number, longitude: number): Promise<{
    id: number;
    latitude: number;
    longitude: number;
    forecastData: import("@prisma/client/runtime/library").JsonValue;
    fetchedAt: Date;
    expiresAt: Date;
} | null>;
/**
 * Clean expired weather forecasts (maintenance job)
 *
 * Should be run periodically (e.g., daily cron job)
 *
 * @returns Number of deleted forecast records
 */
export declare function cleanExpiredForecasts(): Promise<number>;
/**
 * @deprecated Use getDailyAirTempByNode instead
 *
 * This function queries the deprecated WeatherReading table.
 * Air temperature data is now part of SensorReading.
 *
 * Kept for backward compatibility during migration period.
 */
export declare function getLatestWeatherReading(gatewayId: string): Promise<{
    timestamp: Date;
    airTemperature: number;
    id: number;
    gatewayId: string;
    humidity: number;
    pressure: number | null;
} | null>;
/**
 * @deprecated Use getAirTempReadingsForDateRange instead
 *
 * Queries deprecated WeatherReading table.
 */
export declare function getWeatherReadingsForDateRange(gatewayId: string, startDate: Date, endDate: Date): Promise<{
    timestamp: Date;
    airTemperature: number;
    id: number;
    gatewayId: string;
    humidity: number;
    pressure: number | null;
}[]>;
//# sourceMappingURL=weather.repository.d.ts.map