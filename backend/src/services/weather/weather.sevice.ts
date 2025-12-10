// src/services/weather/weather.service.ts
/**
 * Weather Service - OpenWeatherMap Integration
 * Fetches 5-day forecast with caching
 */

import axios from 'axios';
import { env } from '../../config/environment.js';
import { createLogger } from '../../config/logger.js';
import { WEATHER_CONSTANTS } from '../../utils/constants.js';
import {
    cacheWeatherForecast,
    getCachedWeatherForecast,
} from '../../repositories/weather.repository.js';
import type { WeatherForecast, WeatherForecastDay } from '../../models/common.types.js';
import { ExternalServiceError } from '../../utils/errors.js';

const logger = createLogger({ service: 'weather' });

const OWM_BASE_URL = 'https://api.openweathermap.org/data/2.5/forecast';

interface OpenWeatherResponse {
    list: Array<{
        dt: number;
        main: {
            temp: number;
            humidity: number;
            temp_min: number;
            temp_max: number;
        };
        weather: Array<{
            description: string;
        }>;
        rain?: {
            '3h': number;
        };
    }>;
}

/**
 * Fetch weather forecast from OpenWeatherMap API
 */
async function fetchFromAPI(latitude: number, longitude: number): Promise<WeatherForecast> {
    try {
        logger.info({ latitude, longitude }, 'Fetching weather from OpenWeatherMap');

        const response = await axios.get<OpenWeatherResponse>(OWM_BASE_URL, {
            params: {
                lat: latitude,
                lon: longitude,
                appid: env.OPENWEATHER_API_KEY,
                units: 'metric',
                cnt: 40, // 5 days × 8 readings per day (3-hour intervals)
            },
            timeout: WEATHER_CONSTANTS.API_TIMEOUT_MS,
        });

        // Group by date and calculate daily aggregates
        const dailyData = new Map<string, {
            temps: number[];
            humidity: number[];
            precipitation: number;
            descriptions: string[];
        }>();

        for (const item of response.data.list) {
            const dateStr = new Date(item.dt * 1000).toISOString().split('T')[0];

            if (!dateStr) {
                continue; // Skip if date parsing failed
            }

            if (!dailyData.has(dateStr)) {
                dailyData.set(dateStr, {
                    temps: [],
                    humidity: [],
                    precipitation: 0,
                    descriptions: [],
                });
            }

            const dayData = dailyData.get(dateStr);
            if (dayData) {
                dayData.temps.push(item.main.temp);
                dayData.humidity.push(item.main.humidity);
                dayData.precipitation += item.rain?.['3h'] ?? 0;
                dayData.descriptions.push(item.weather[0]?.description ?? 'Clear');
            }
        }

        // Convert to daily forecast
        const forecast: WeatherForecastDay[] = Array.from(dailyData.entries())
            .slice(0, WEATHER_CONSTANTS.FORECAST_DAYS)
            .map(([date, data]) => ({
                date,
                tempMax: Number(Math.max(...data.temps).toFixed(1)),
                tempMin: Number(Math.min(...data.temps).toFixed(1)),
                tempAvg: Number((data.temps.reduce((a, b) => a + b, 0) / data.temps.length).toFixed(1)),
                humidity: Number((data.humidity.reduce((a, b) => a + b, 0) / data.humidity.length).toFixed(0)),
                precipitation: Number(data.precipitation.toFixed(1)),
                description: data.descriptions[0] ?? 'Clear',
            }));

        const now = new Date();
        const result: WeatherForecast = {
            latitude,
            longitude,
            fetchedAt: now,
            expiresAt: new Date(now.getTime() + WEATHER_CONSTANTS.CACHE_TTL_HOURS * 60 * 60 * 1000),
            forecast,
        };

        // Cache in database
        await cacheWeatherForecast(
            latitude,
            longitude,
            forecast,
            WEATHER_CONSTANTS.CACHE_TTL_HOURS
        );

        logger.info({ latitude, longitude, days: forecast.length }, 'Weather forecast cached');

        return result;

    } catch (error) {
        if (axios.isAxiosError(error)) {
            const errorMessage = error.message ?? 'Unknown API error';
            logger.error({ error: errorMessage, status: error.response?.status }, 'OpenWeatherMap API error');
            throw new ExternalServiceError('OpenWeatherMap', error);
        }
        throw error;
    }
}

/**
 * Validate and parse cached forecast data
 */
function parseCachedForecast(forecastData: unknown): WeatherForecastDay[] {
    if (!Array.isArray(forecastData)) {
        throw new Error('Invalid cached forecast data format');
    }

    return forecastData as WeatherForecastDay[];
}

/**
 * Get weather forecast with caching
 */
export async function getWeatherForecast(latitude: number, longitude: number): Promise<WeatherForecast> {
    try {
        // Check cache first
        const cached = await getCachedWeatherForecast(latitude, longitude);

        if (cached) {
            logger.debug({ latitude, longitude }, 'Weather forecast cache hit');

            return {
                latitude: cached.latitude,
                longitude: cached.longitude,
                fetchedAt: cached.fetchedAt,
                expiresAt: cached.expiresAt,
                forecast: parseCachedForecast(cached.forecastData),
            };
        }

        // Cache miss - fetch from API
        logger.debug({ latitude, longitude }, 'Weather forecast cache miss');
        return await fetchFromAPI(latitude, longitude);

    } catch (error) {
        logger.error({ error, latitude, longitude }, 'Failed to get weather forecast');
        throw error;
    }
}

/**
 * Check if significant rain is expected in forecast window
 */
export async function isRainExpected(
    latitude: number,
    longitude: number,
    hoursAhead: number = 48,
    thresholdMm: number = 5
): Promise<{ expected: boolean; totalMm: number; description: string }> {
    try {
        const forecast = await getWeatherForecast(latitude, longitude);

        const now = new Date();
        const cutoffDate = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
        const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

        if (!cutoffDateStr) {
            throw new Error('Failed to format cutoff date');
        }

        let totalRain = 0;
        const relevantDays = forecast.forecast.filter(day => day.date <= cutoffDateStr);

        for (const day of relevantDays) {
            totalRain += day.precipitation;
        }

        const expected = totalRain >= thresholdMm;

        return {
            expected,
            totalMm: Number(totalRain.toFixed(1)),
            description: expected
                ? `${totalRain.toFixed(1)}mm rain expected in next ${hoursAhead}h`
                : `No significant rain expected (${totalRain.toFixed(1)}mm)`,
        };

    } catch (error) {
        logger.warn({ error, latitude, longitude }, 'Rain check failed, assuming no rain');
        return {
            expected: false,
            totalMm: 0,
            description: 'Weather data unavailable',
        };
    }
}

/**
 * Get simplified ET estimation using Hargreaves method
 * ET0 ≈ 0.0023 × (Tmean + 17.8) × (Tmax - Tmin)^0.5 × Ra
 * Simplified without solar radiation: ET0 ≈ 0.0135 × (Tmean + 17.8) × TD
 */
export async function estimateDailyET(
    latitude: number,
    longitude: number
): Promise<number> {
    try {
        const forecast = await getWeatherForecast(latitude, longitude);

        if (forecast.forecast.length === 0) {
            return 4.0; // Default ET for UP region (mm/day)
        }

        const today = forecast.forecast[0];
        if (!today) {
            return 4.0;
        }

        const tempDiff = Math.max(today.tempMax - today.tempMin, 1);
        const tempMean = today.tempAvg;

        // Simplified Hargreaves formula (without Ra calculation)
        const et0 = 0.0135 * (tempMean + 17.8) * tempDiff;

        return Number(Math.max(et0, 1.0).toFixed(2)); // Minimum 1mm/day

    } catch (error) {
        logger.warn({ error }, 'ET estimation failed, using default');
        return 4.0;
    }
}
