/**
 * GDD (Growing Degree Days) Calculation Service
 * For crop growth stage tracking in North India
 *
 * GDD measures heat accumulation above a crop's base temperature.
 * Used to predict growth stages and optimize irrigation timing.
 */
/**
 * Base temperatures for North India crops (°C)
 * Below these temps, crops don't accumulate growth
 */
export const CROP_BASE_TEMPS = {
    rice: 10,
    wheat: 0,
    maize: 8,
    mustard: 0,
    chickpea: 0,
    cotton: 12,
    sugarcane: 10,
    pigeonpeas: 10,
    kidneybeans: 8,
    mothbeans: 8,
    mungbean: 10,
    blackgram: 10,
    lentil: 0,
    pomegranate: 10,
    banana: 14,
    mango: 10,
    grapes: 10,
    watermelon: 15,
    muskmelon: 15,
    apple: 4,
    papaya: 15,
    coconut: 20,
    jute: 12,
    coffee: 10
};
/**
 * Total GDD requirements for maturity (North India climate)
 * These are accumulated degree-days from sowing to harvest
 */
export const CROP_GDD_REQUIREMENTS = {
    rice: 2200,
    wheat: 2700,
    maize: 2400,
    mustard: 2100,
    chickpea: 1800,
    cotton: 2800,
    sugarcane: 5000,
    pigeonpeas: 2500,
    kidneybeans: 1800,
    mothbeans: 1600,
    mungbean: 1400,
    blackgram: 1300,
    lentil: 1900,
    pomegranate: 3500,
    banana: 3600,
    mango: 4000,
    grapes: 2800,
    watermelon: 1800,
    muskmelon: 1600,
    apple: 2500,
    papaya: 3000,
    coconut: 7000,
    jute: 2200,
    coffee: 3200
};
/**
 * Upper temperature thresholds (°C)
 * Above these temps, GDD accumulation slows/stops
 */
export const CROP_UPPER_TEMPS = {
    rice: 40,
    wheat: 35,
    maize: 38,
    mustard: 35,
    chickpea: 35,
    cotton: 40,
    sugarcane: 42,
    default: 35
};
/**
 * Calculate daily GDD using simple average method
 * Formula: GDD = ((Tmax + Tmin) / 2) - Tbase
 * Negative values clamped to 0
 *
 * @param tempMax - Maximum temperature (°C)
 * @param tempMin - Minimum temperature (°C)
 * @param baseTemp - Crop base temperature (°C)
 * @returns Daily GDD value
 */
export function calculateDailyGDD(tempMax, tempMin, baseTemp) {
    const avgTemp = (tempMax + tempMin) / 2;
    const gdd = Math.max(0, avgTemp - baseTemp);
    return Math.round(gdd * 10) / 10; // Round to 1 decimal
}
/**
 * Calculate daily GDD with upper threshold (more accurate)
 * Formula: GDD = ((min(Tmax, Tupper) + max(Tmin, Tbase)) / 2) - Tbase
 *
 * @param tempMax - Maximum temperature (°C)
 * @param tempMin - Minimum temperature (°C)
 * @param baseTemp - Crop base temperature (°C)
 * @param upperTemp - Upper threshold temperature (°C)
 * @returns Daily GDD value
 */
export function calculateDailyGDDWithThreshold(tempMax, tempMin, baseTemp, upperTemp = 35) {
    const adjustedMax = Math.min(tempMax, upperTemp);
    const adjustedMin = Math.max(tempMin, baseTemp);
    if (adjustedMin >= adjustedMax) {
        return 0; // No heat accumulation
    }
    const avgTemp = (adjustedMax + adjustedMin) / 2;
    const gdd = Math.max(0, avgTemp - baseTemp);
    return Math.round(gdd * 10) / 10;
}
/**
 * Calculate GDD from weather forecast (7-day projection)
 *
 * @param cropName - Crop name
 * @param forecast - Array of daily forecasts with temp_max_c and temp_min_c
 * @returns Total GDD accumulated over forecast period
 */
export function calculateForecastGDD(cropName, forecast) {
    const baseTemp = getCropBaseTemp(cropName);
    let totalGDD = 0;
    forecast.forEach(day => {
        totalGDD += calculateDailyGDD(day.temp_max_c, day.temp_min_c, baseTemp);
    });
    return Math.round(totalGDD * 10) / 10;
}
/**
 * Map accumulated GDD to growth stage
 *
 * @param accumulatedGDD - Total GDD accumulated since sowing
 * @param totalRequiredGDD - Total GDD required for crop maturity
 * @returns Current growth stage
 */
export function getGrowthStage(accumulatedGDD, totalRequiredGDD) {
    const progress = (accumulatedGDD / totalRequiredGDD) * 100;
    if (progress < 15)
        return 'INITIAL';
    if (progress < 40)
        return 'DEVELOPMENT';
    if (progress < 75)
        return 'MID_SEASON';
    if (progress < 95)
        return 'LATE_SEASON';
    return 'HARVEST_READY';
}
/**
 * Get detailed growth stage information
 *
 * @param cropName - Crop name
 * @param accumulatedGDD - Total GDD accumulated
 * @param daysElapsed - Days since sowing
 * @param avgDailyGDD - Average daily GDD (for estimation)
 * @returns Detailed growth stage info
 */
export function getGrowthStageInfo(cropName, accumulatedGDD, daysElapsed, avgDailyGDD = 20) {
    const normalizedCrop = cropName.toLowerCase().replace(/\s+/g, '');
    const requiredGDD = CROP_GDD_REQUIREMENTS[normalizedCrop] || 2000;
    const progress = Math.min(100, (accumulatedGDD / requiredGDD) * 100);
    const stage = getGrowthStage(accumulatedGDD, requiredGDD);
    const gddRemaining = Math.max(0, requiredGDD - accumulatedGDD);
    // Estimate days to maturity based on avg daily GDD
    const estimatedDaysToMaturity = avgDailyGDD > 0
        ? Math.ceil(gddRemaining / avgDailyGDD)
        : 0;
    const description = getGrowthStageDescription(stage);
    return {
        stage,
        progress: Math.round(progress * 10) / 10,
        daysElapsed,
        gddAccumulated: Math.round(accumulatedGDD * 10) / 10,
        gddRequired: requiredGDD,
        gddRemaining: Math.round(gddRemaining * 10) / 10,
        estimatedDaysToMaturity,
        description_en: description.description,
        description_hi: description.name_hi
    };
}
/**
 * Get human-readable growth stage description
 */
export function getGrowthStageDescription(stage) {
    const descriptions = {
        INITIAL: {
            name_en: 'Initial / Germination',
            name_hi: 'प्रारंभिक / अंकुरण',
            description: 'Seed germination and early seedling establishment. Low water demand.'
        },
        DEVELOPMENT: {
            name_en: 'Vegetative Development',
            name_hi: 'वानस्पतिक विकास',
            description: 'Active vegetative growth. Leaves and stems developing. Increasing water need.'
        },
        MID_SEASON: {
            name_en: 'Mid-Season / Flowering',
            name_hi: 'मध्य-मौसम / फूल आना',
            description: 'Peak growth and flowering. Maximum water demand. Critical irrigation period.'
        },
        LATE_SEASON: {
            name_en: 'Late Season / Grain Filling',
            name_hi: 'देर से मौसम / अनाज भरना',
            description: 'Grain/fruit filling and maturation. Water demand decreasing.'
        },
        HARVEST_READY: {
            name_en: 'Harvest Ready / Maturity',
            name_hi: 'कटाई के लिए तैयार',
            description: 'Crop matured and ready for harvest. Minimal water needed.'
        }
    };
    return descriptions[stage];
}
/**
 * Get crop-specific base temperature
 *
 * @param cropName - Crop name
 * @returns Base temperature in °C
 */
export function getCropBaseTemp(cropName) {
    const normalizedCrop = cropName.toLowerCase().replace(/\s+/g, '');
    return CROP_BASE_TEMPS[normalizedCrop] || 10; // Default 10°C
}
/**
 * Get crop-specific GDD requirement
 *
 * @param cropName - Crop name
 * @returns Total GDD required for maturity
 */
export function getCropGDDRequirement(cropName) {
    const normalizedCrop = cropName.toLowerCase().replace(/\s+/g, '');
    return CROP_GDD_REQUIREMENTS[normalizedCrop] || 2000; // Default 2000
}
/**
 * Get crop-specific upper temperature threshold
 *
 * @param cropName - Crop name
 * @returns Upper temperature threshold in °C
 */
export function getCropUpperTemp(cropName) {
    const normalizedCrop = cropName.toLowerCase().replace(/\s+/g, '');
    return CROP_UPPER_TEMPS[normalizedCrop] || CROP_UPPER_TEMPS.default;
}
/**
 * Validate if crop is suitable for current temperature range
 *
 * @param cropName - Crop name
 * @param avgTemp - Average temperature
 * @param minTemp - Minimum temperature
 * @returns Suitability result with reason
 */
export function isCropSuitableForTemperature(cropName, avgTemp, minTemp) {
    const baseTemp = getCropBaseTemp(cropName);
    if (avgTemp < baseTemp) {
        return {
            suitable: false,
            reason: `Temperature too low (${avgTemp}°C < ${baseTemp}°C base). Crop will not accumulate GDD.`,
            baseTemp,
            avgTemp
        };
    }
    if (minTemp < baseTemp - 5) {
        return {
            suitable: false,
            reason: `Night temperature too low (${minTemp}°C). Risk of frost damage.`,
            baseTemp,
            avgTemp
        };
    }
    return {
        suitable: true,
        reason: `Temperature suitable for ${cropName} (avg ${avgTemp}°C, base ${baseTemp}°C)`,
        baseTemp,
        avgTemp
    };
}
/**
 * Update GDD for a field using weather data
 * Called daily or when weather data is fetched
 *
 * @param fieldId - Field ID
 * @param cropName - Crop name
 * @param sowingDate - Date crop was sown
 * @param tempMax - Maximum temperature for the day
 * @param tempMin - Minimum temperature for the day
 * @param prisma - PrismaClient instance
 * @returns GDD update result
 */
export async function updateFieldGDD(fieldId, cropName, sowingDate, tempMax, tempMin, prisma) {
    // Get current field data
    const field = await prisma.field.findUnique({
        where: { id: fieldId }
    });
    if (!field) {
        throw new Error(`Field ${fieldId} not found`);
    }
    // Calculate daily GDD
    const baseTemp = getCropBaseTemp(cropName);
    const upperTemp = getCropUpperTemp(cropName);
    const dailyGDD = calculateDailyGDDWithThreshold(tempMax, tempMin, baseTemp, upperTemp);
    // Add to accumulated
    const previousGDD = field.accumulatedGDD || 0;
    const newGDD = previousGDD + dailyGDD;
    // Calculate growth stage
    const requiredGDD = getCropGDDRequirement(cropName);
    const stage = getGrowthStage(newGDD, requiredGDD);
    const progress = (newGDD / requiredGDD) * 100;
    // Update database
    await prisma.field.update({
        where: { id: fieldId },
        data: {
            accumulatedGDD: newGDD,
            lastGDDUpdate: new Date(),
            currentGrowthStage: stage
        }
    });
    console.log(`✅ GDD updated for field ${fieldId}: ${previousGDD.toFixed(1)} → ${newGDD.toFixed(1)} (stage: ${stage})`);
    return {
        previousGDD: Math.round(previousGDD * 10) / 10,
        newGDD: Math.round(newGDD * 10) / 10,
        dailyGDDAdded: dailyGDD,
        growthStage: stage,
        progress: Math.round(progress * 10) / 10
    };
}
/**
 * Batch update GDD for all active fields
 * Should be called once per day
 *
 * @param weatherDataMap - Map of fieldId to weather data { temp_max_c, temp_min_c }
 * @param prisma - PrismaClient instance
 * @returns Array of update results
 */
export async function batchUpdateGDD(weatherDataMap, prisma) {
    const results = [];
    // Get all confirmed fields that need update
    const fields = await prisma.field.findMany({
        where: {
            cropConfirmed: true,
            selectedCrop: { not: null },
            sowingDate: { not: null }
        }
    });
    console.log(`🔄 Batch updating GDD for ${fields.length} fields...`);
    for (const field of fields) {
        const weather = weatherDataMap.get(field.id);
        if (!weather || !field.selectedCrop || !field.sowingDate) {
            continue;
        }
        try {
            const result = await updateFieldGDD(field.id, field.selectedCrop, field.sowingDate, weather.temp_max_c, weather.temp_min_c, prisma);
            results.push(result);
        }
        catch (error) {
            console.error(`❌ Error updating GDD for field ${field.id}:`, error);
        }
    }
    console.log(`✅ Batch GDD update complete: ${results.length} fields updated`);
    return results;
}
/**
 * Reset GDD for a field (when crop is changed or replanted)
 *
 * @param fieldId - Field ID
 * @param prisma - PrismaClient instance
 */
export async function resetFieldGDD(fieldId, prisma) {
    await prisma.field.update({
        where: { id: fieldId },
        data: {
            accumulatedGDD: 0,
            lastGDDUpdate: null,
            currentGrowthStage: null
        }
    });
    console.log(`🔄 GDD reset for field ${fieldId}`);
}
/**
 * Calculate days elapsed since sowing
 */
export function getDaysElapsed(sowingDate) {
    const now = new Date();
    const diffMs = now.getTime() - sowingDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
/**
 * Calculate average daily GDD from accumulated GDD and days
 */
export function getAverageDailyGDD(accumulatedGDD, daysElapsed) {
    if (daysElapsed === 0)
        return 0;
    return Math.round((accumulatedGDD / daysElapsed) * 10) / 10;
}
/**
 * Get all available crops
 */
export function getAvailableCrops() {
    return Object.keys(CROP_BASE_TEMPS);
}
/**
 * Get crop parameters summary
 */
export function getCropParameters(cropName) {
    const normalizedCrop = cropName.toLowerCase().replace(/\s+/g, '');
    if (!CROP_BASE_TEMPS[normalizedCrop]) {
        return null;
    }
    return {
        baseTemp: getCropBaseTemp(cropName),
        upperTemp: getCropUpperTemp(cropName),
        requiredGDD: getCropGDDRequirement(cropName)
    };
}
//# sourceMappingURL=gddService.js.map