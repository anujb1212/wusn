/**
 * Weather Data Repository
 */
export interface CreateWeatherReadingInput {
    gatewayId: string;
    airTemperature: number;
    humidity: number;
    pressure?: number | undefined;
    timestamp: Date;
}
/**
 * Create weather reading from gateway sensor
 */
export declare function createWeatherReading(input: CreateWeatherReadingInput): Promise<{
    timestamp: Date;
    id: number;
    gatewayId: string;
    airTemperature: number;
    humidity: number;
    pressure: number | null;
}>;
/**
 * Get latest weather reading for gateway
 */
export declare function getLatestWeatherReading(gatewayId: string): Promise<{
    timestamp: Date;
    id: number;
    gatewayId: string;
    airTemperature: number;
    humidity: number;
    pressure: number | null;
} | null>;
/**
 * Get weather readings for date range
 */
export declare function getWeatherReadingsForDateRange(gatewayId: string, startDate: Date, endDate: Date): Promise<{
    timestamp: Date;
    id: number;
    gatewayId: string;
    airTemperature: number;
    humidity: number;
    pressure: number | null;
}[]>;
/**
 * Get daily average air temperature
 */
export declare function getDailyAverageAirTemp(gatewayId: string, date: Date): Promise<{
    avgAirTemp: number;
    minAirTemp: number;
    maxAirTemp: number;
    readingsCount: number;
} | null>;
/**
 * Cache weather forecast
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
 * Get cached weather forecast
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
 * Clean expired weather forecasts
 */
export declare function cleanExpiredForecasts(): Promise<number>;
//# sourceMappingURL=weather.repository.d.ts.map