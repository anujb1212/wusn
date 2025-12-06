import dotenv from 'dotenv';
dotenv.config();
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const weatherCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
/**
 * Clear expired cache entries (cleanup)
 */
function clearExpiredCache() {
    const now = Date.now();
    const keysToDelete = [];
    weatherCache.forEach((entry, key) => {
        if (now - entry.timestamp > CACHE_TTL_MS) {
            keysToDelete.push(key);
        }
    });
    keysToDelete.forEach(key => weatherCache.delete(key));
    if (keysToDelete.length > 0) {
        console.log(`🗑️  Cleared ${keysToDelete.length} expired weather cache entries`);
    }
}
// Run cache cleanup every hour
setInterval(clearExpiredCache, CACHE_TTL_MS);
/**
 * Fetch weather forecast for given coordinates (with cache)
 * @param latitude - Field latitude
 * @param longitude - Field longitude
 * @returns Weather data with current + 7-day forecast
 */
export async function fetchWeatherWithCache(latitude, longitude) {
    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const cached = weatherCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        console.log(`📦 Using cached weather data for ${cacheKey}`);
        return cached.data;
    }
    const fresh = await fetchWeatherForecast(latitude, longitude);
    weatherCache.set(cacheKey, { data: fresh, timestamp: Date.now() });
    return fresh;
}
/**
 * Fetch weather forecast for given coordinates (direct, no cache)
 * @param latitude - Field latitude
 * @param longitude - Field longitude
 * @returns Weather data with current + 7-day forecast
 */
export async function fetchWeatherForecast(latitude, longitude) {
    // Validate inputs
    if (!isValidCoordinate(latitude, longitude)) {
        console.error('❌ Invalid coordinates provided');
        return getMockWeatherData();
    }
    if (!OPENWEATHER_API_KEY) {
        console.warn('⚠️  OPENWEATHER_API_KEY not set in .env file');
        return getMockWeatherData();
    }
    try {
        console.log(`🌤️  Fetching weather for lat=${latitude}, lon=${longitude}...`);
        // Fetch current weather
        const currentUrl = `${OPENWEATHER_BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        const currentResponse = await fetch(currentUrl);
        if (!currentResponse.ok) {
            throw new Error(`OpenWeather API error: ${currentResponse.status} ${currentResponse.statusText}`);
        }
        const currentData = await currentResponse.json();
        // Fetch 5-day/3-hour forecast
        const forecastUrl = `${OPENWEATHER_BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        const forecastResponse = await fetch(forecastUrl);
        if (!forecastResponse.ok) {
            throw new Error(`OpenWeather forecast error: ${forecastResponse.status} ${forecastResponse.statusText}`);
        }
        const forecastData = await forecastResponse.json();
        // Process current weather
        const current = {
            temp_c: Math.round(currentData.main.temp * 10) / 10,
            humidity: currentData.main.humidity,
            description: currentData.weather[0]?.description || 'unknown'
        };
        // Process 7-day forecast
        const dailyForecasts = processForecastData(forecastData.list);
        console.log(`✅ Weather fetched: Current ${current.temp_c}°C, ${dailyForecasts.length} days forecast`);
        return {
            current,
            forecast_7day: dailyForecasts
        };
    }
    catch (error) {
        console.error('❌ Error fetching weather from OpenWeatherMap:', error);
        console.log('⚠️  Falling back to mock weather data');
        return getMockWeatherData();
    }
}
/**
 * Validate latitude and longitude
 */
function isValidCoordinate(latitude, longitude) {
    return (!isNaN(latitude) &&
        !isNaN(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180);
}
/**
 * Process OpenWeatherMap 5-day/3-hour forecast into daily min/max/rain
 */
function processForecastData(forecastList) {
    const dailyMap = new Map();
    // Group by date
    forecastList.forEach((item) => {
        const dateParts = item.dt_txt.split(' ');
        if (dateParts.length < 1) {
            console.warn('⚠️  Invalid dt_txt format:', item.dt_txt);
            return;
        }
        const date = dateParts[0]; // "2025-12-04"
        if (!date) {
            return;
        }
        if (!dailyMap.has(date)) {
            dailyMap.set(date, { temps: [], rains: [], descriptions: [] });
        }
        const dayData = dailyMap.get(date);
        if (!dayData) {
            return;
        }
        dayData.temps.push(item.main.temp);
        dayData.rains.push(item.rain?.['3h'] || 0); // Rain in last 3 hours
        const description = item.weather[0]?.description;
        if (description) {
            dayData.descriptions.push(description);
        }
    });
    // Convert to daily forecasts
    const dailyForecasts = [];
    dailyMap.forEach((data, date) => {
        if (data.temps.length === 0) {
            return; // Skip if no data
        }
        dailyForecasts.push({
            date,
            temp_max_c: Math.round(Math.max(...data.temps) * 10) / 10,
            temp_min_c: Math.round(Math.min(...data.temps) * 10) / 10,
            rain_mm: Math.round(data.rains.reduce((a, b) => a + b, 0) * 10) / 10,
            description: data.descriptions[0] || 'unknown'
        });
    });
    // Return first 7 days (sorted by date)
    return dailyForecasts
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 7);
}
/**
 * Mock weather data (fallback when API fails or no key)
 */
function getMockWeatherData() {
    const today = new Date();
    const forecast = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        // Simulate North India December weather patterns
        const baseMaxTemp = 26;
        const baseMinTemp = 16;
        const tempVariation = Math.sin(i / 7 * Math.PI) * 4; // Slight wave pattern
        forecast.push({
            date: date.toISOString().split('T')[0],
            temp_max_c: Math.round((baseMaxTemp + tempVariation + Math.random() * 2) * 10) / 10,
            temp_min_c: Math.round((baseMinTemp + tempVariation - Math.random() * 2) * 10) / 10,
            rain_mm: Math.random() > 0.8 ? Math.round(Math.random() * 12 * 10) / 10 : 0,
            description: Math.random() > 0.7 ? 'partly cloudy' : 'clear sky'
        });
    }
    return {
        current: {
            temp_c: 24.5,
            humidity: 62,
            description: 'partly cloudy'
        },
        forecast_7day: forecast
    };
}
/**
 * Calculate 7-day cumulative rainfall from forecast
 */
export function getCumulativeRainfall(weatherData) {
    return weatherData.forecast_7day.reduce((sum, day) => sum + day.rain_mm, 0);
}
/**
 * Get temperature range (min/max) for next 7 days
 */
export function getTemperatureRange(weatherData) {
    const temps = weatherData.forecast_7day.flatMap(day => [day.temp_min_c, day.temp_max_c]);
    if (temps.length === 0) {
        return { min: 0, max: 0, avg: 0 };
    }
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const avg = Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10;
    return { min, max, avg };
}
/**
 * Check if significant rain expected in next N days
 */
export function isSignificantRainExpected(weatherData, days = 3, thresholdMm = 15) {
    const nextNDays = weatherData.forecast_7day.slice(0, days);
    const cumulativeRain = nextNDays.reduce((sum, day) => sum + day.rain_mm, 0);
    return cumulativeRain >= thresholdMm;
}
/**
 * Clear weather cache manually (for testing)
 */
export function clearWeatherCache() {
    weatherCache.clear();
    console.log('🗑️  Weather cache cleared');
}
/**
 * Get cache statistics
 */
export function getCacheStats() {
    return {
        size: weatherCache.size,
        keys: Array.from(weatherCache.keys())
    };
}
//# sourceMappingURL=weatherService.js.map