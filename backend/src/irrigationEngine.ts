
import type { PrismaClient } from '@prisma/client';
import { fetchWeatherWithCache, type WeatherData, getCumulativeRainfall, isSignificantRainExpected } from './weatherService.js';
import { getGrowthStageInfo, getCropBaseTemp, type GrowthStage } from './gddService.js';


/**
 * Crop-specific irrigation parameters for ALL dataset crops
 * Kc = Crop coefficient (water requirement multiplier)
 * min/max_moisture_pct = Optimal soil moisture range for each growth stage
 */
export const CROP_PARAMETERS = {
    rice: {
        name_hi: 'चावल',
        name_en: 'Rice',
        season: 'KHARIF',
        stages: {
            INITIAL: { Kc: 0.5, min_moisture_pct: 75, max_moisture_pct: 100, duration_days: 30 },
            DEVELOPMENT: { Kc: 0.8, min_moisture_pct: 80, max_moisture_pct: 100, duration_days: 30 },
            MID_SEASON: { Kc: 1.2, min_moisture_pct: 85, max_moisture_pct: 100, duration_days: 80 },
            LATE_SEASON: { Kc: 0.8, min_moisture_pct: 75, max_moisture_pct: 100, duration_days: 30 },
            HARVEST_READY: { Kc: 0.5, min_moisture_pct: 60, max_moisture_pct: 90, duration_days: 10 }
        }
    },
    maize: {
        name_hi: 'मक्का',
        name_en: 'Maize',
        season: 'KHARIF',
        stages: {
            INITIAL: { Kc: 0.3, min_moisture_pct: 50, max_moisture_pct: 80, duration_days: 25 },
            DEVELOPMENT: { Kc: 0.7, min_moisture_pct: 55, max_moisture_pct: 85, duration_days: 35 },
            MID_SEASON: { Kc: 1.2, min_moisture_pct: 60, max_moisture_pct: 85, duration_days: 50 },
            LATE_SEASON: { Kc: 0.6, min_moisture_pct: 50, max_moisture_pct: 75, duration_days: 30 },
            HARVEST_READY: { Kc: 0.4, min_moisture_pct: 40, max_moisture_pct: 70, duration_days: 10 }
        }
    },
    chickpea: {
        name_hi: 'चना',
        name_en: 'Chickpea',
        season: 'RABI',
        stages: {
            INITIAL: { Kc: 0.3, min_moisture_pct: 45, max_moisture_pct: 75, duration_days: 25 },
            DEVELOPMENT: { Kc: 0.7, min_moisture_pct: 50, max_moisture_pct: 80, duration_days: 35 },
            MID_SEASON: { Kc: 1.0, min_moisture_pct: 55, max_moisture_pct: 80, duration_days: 50 },
            LATE_SEASON: { Kc: 0.5, min_moisture_pct: 45, max_moisture_pct: 70, duration_days: 25 },
            HARVEST_READY: { Kc: 0.3, min_moisture_pct: 40, max_moisture_pct: 65, duration_days: 10 }
        }
    },
    kidneybeans: {
        name_hi: 'राजमा',
        name_en: 'Kidney Beans',
        season: 'KHARIF',
        stages: {
            INITIAL: { Kc: 0.3, min_moisture_pct: 50, max_moisture_pct: 80, duration_days: 20 },
            DEVELOPMENT: { Kc: 0.7, min_moisture_pct: 55, max_moisture_pct: 85, duration_days: 30 },
            MID_SEASON: { Kc: 1.05, min_moisture_pct: 60, max_moisture_pct: 85, duration_days: 40 },
            LATE_SEASON: { Kc: 0.65, min_moisture_pct: 50, max_moisture_pct: 75, duration_days: 25 },
            HARVEST_READY: { Kc: 0.4, min_moisture_pct: 40, max_moisture_pct: 70, duration_days: 10 }
        }
    },
    pigeonpeas: {
        name_hi: 'अरहर',
        name_en: 'Pigeon Peas',
        season: 'KHARIF',
        stages: {
            INITIAL: { Kc: 0.3, min_moisture_pct: 45, max_moisture_pct: 75, duration_days: 30 },
            DEVELOPMENT: { Kc: 0.7, min_moisture_pct: 50, max_moisture_pct: 80, duration_days: 40 },
            MID_SEASON: { Kc: 1.0, min_moisture_pct: 55, max_moisture_pct: 80, duration_days: 60 },
            LATE_SEASON: { Kc: 0.6, min_moisture_pct: 45, max_moisture_pct: 70, duration_days: 30 },
            HARVEST_READY: { Kc: 0.4, min_moisture_pct: 40, max_moisture_pct: 65, duration_days: 10 }
        }
    },
    mothbeans: {
        name_hi: 'मोठ',
        name_en: 'Moth Beans',
        season: 'KHARIF',
        stages: {
            INITIAL: { Kc: 0.3, min_moisture_pct: 45, max_moisture_pct: 75, duration_days: 20 },
            DEVELOPMENT: { Kc: 0.7, min_moisture_pct: 50, max_moisture_pct: 80, duration_days: 30 },
            MID_SEASON: { Kc: 1.05, min_moisture_pct: 55, max_moisture_pct: 80, duration_days: 40 },
            LATE_SEASON: { Kc: 0.6, min_moisture_pct: 45, max_moisture_pct: 70, duration_days: 20 },
            HARVEST_READY: { Kc: 0.4, min_moisture_pct: 40, max_moisture_pct: 65, duration_days: 10 }
        }
    },
    mungbean: {
        name_hi: 'मूंग',
        name_en: 'Mung Bean',
        season: 'KHARIF',
        stages: {
            INITIAL: { Kc: 0.3, min_moisture_pct: 50, max_moisture_pct: 80, duration_days: 20 },
            DEVELOPMENT: { Kc: 0.7, min_moisture_pct: 55, max_moisture_pct: 85, duration_days: 25 },
            MID_SEASON: { Kc: 1.05, min_moisture_pct: 60, max_moisture_pct: 85, duration_days: 35 },
            LATE_SEASON: { Kc: 0.65, min_moisture_pct: 50, max_moisture_pct: 75, duration_days: 20 },
            HARVEST_READY: { Kc: 0.4, min_moisture_pct: 40, max_moisture_pct: 70, duration_days: 10 }
        }
    },
    blackgram: {
        name_hi: 'उड़द',
        name_en: 'Black Gram',
        season: 'KHARIF',
        stages: {
            INITIAL: { Kc: 0.3, min_moisture_pct: 50, max_moisture_pct: 80, duration_days: 20 },
            DEVELOPMENT: { Kc: 0.7, min_moisture_pct: 55, max_moisture_pct: 85, duration_days: 25 },
            MID_SEASON: { Kc: 1.05, min_moisture_pct: 60, max_moisture_pct: 85, duration_days: 35 },
            LATE_SEASON: { Kc: 0.65, min_moisture_pct: 50, max_moisture_pct: 75, duration_days: 20 },
            HARVEST_READY: { Kc: 0.4, min_moisture_pct: 40, max_moisture_pct: 70, duration_days: 10 }
        }
    },
    lentil: {
        name_hi: 'मसूर',
        name_en: 'Lentil',
        season: 'RABI',
        stages: {
            INITIAL: { Kc: 0.3, min_moisture_pct: 45, max_moisture_pct: 75, duration_days: 25 },
            DEVELOPMENT: { Kc: 0.7, min_moisture_pct: 50, max_moisture_pct: 80, duration_days: 35 },
            MID_SEASON: { Kc: 1.0, min_moisture_pct: 55, max_moisture_pct: 80, duration_days: 50 },
            LATE_SEASON: { Kc: 0.5, min_moisture_pct: 45, max_moisture_pct: 70, duration_days: 25 },
            HARVEST_READY: { Kc: 0.3, min_moisture_pct: 40, max_moisture_pct: 65, duration_days: 10 }
        }
    },
    pomegranate: {
        name_hi: 'अनार',
        name_en: 'Pomegranate',
        season: 'PERENNIAL',
        stages: {
            INITIAL: { Kc: 0.3, min_moisture_pct: 50, max_moisture_pct: 80, duration_days: 40 },
            DEVELOPMENT: { Kc: 0.6, min_moisture_pct: 55, max_moisture_pct: 85, duration_days: 60 },
            MID_SEASON: { Kc: 0.9, min_moisture_pct: 60, max_moisture_pct: 85, duration_days: 100 },
            LATE_SEASON: { Kc: 0.7, min_moisture_pct: 50, max_moisture_pct: 80, duration_days: 50 },
            HARVEST_READY: { Kc: 0.5, min_moisture_pct: 45, max_moisture_pct: 75, duration_days: 20 }
        }
    },
    banana: {
        name_hi: 'केला',
        name_en: 'Banana',
        season: 'PERENNIAL',
        stages: {
            INITIAL: { Kc: 0.5, min_moisture_pct: 60, max_moisture_pct: 90, duration_days: 60 },
            DEVELOPMENT: { Kc: 0.8, min_moisture_pct: 65, max_moisture_pct: 90, duration_days: 90 },
            MID_SEASON: { Kc: 1.1, min_moisture_pct: 70, max_moisture_pct: 95, duration_days: 120 },
            LATE_SEASON: { Kc: 0.9, min_moisture_pct: 65, max_moisture_pct: 90, duration_days: 60 },
            HARVEST_READY: { Kc: 0.75, min_moisture_pct: 60, max_moisture_pct: 85, duration_days: 30 }
        }
    },
    mango: {
        name_hi: 'आम',
        name_en: 'Mango',
        season: 'PERENNIAL',
        stages: {
            INITIAL: { Kc: 0.4, min_moisture_pct: 50, max_moisture_pct: 80, duration_days: 60 },
            DEVELOPMENT: { Kc: 0.7, min_moisture_pct: 55, max_moisture_pct: 85, duration_days: 90 },
            MID_SEASON: { Kc: 0.95, min_moisture_pct: 60, max_moisture_pct: 85, duration_days: 120 },
            LATE_SEASON: { Kc: 0.75, min_moisture_pct: 55, max_moisture_pct: 80, duration_days: 60 },
            HARVEST_READY: { Kc: 0.6, min_moisture_pct: 50, max_moisture_pct: 75, duration_days: 30 }
        }
    },
    grapes: {
        name_hi: 'अंगूर',
        name_en: 'Grapes',
        season: 'PERENNIAL',
        stages: {
            INITIAL: { Kc: 0.3, min_moisture_pct: 45, max_moisture_pct: 75, duration_days: 40 },
            DEVELOPMENT: { Kc: 0.6, min_moisture_pct: 50, max_moisture_pct: 80, duration_days: 50 },
            MID_SEASON: { Kc: 0.85, min_moisture_pct: 55, max_moisture_pct: 80, duration_days: 70 },
            LATE_SEASON: { Kc: 0.65, min_moisture_pct: 50, max_moisture_pct: 75, duration_days: 40 },
            HARVEST_READY: { Kc: 0.5, min_moisture_pct: 45, max_moisture_pct: 70, duration_days: 20 }
        }
    },
    watermelon: {
        name_hi: 'तरबूज',
        name_en: 'Watermelon',
        season: 'SUMMER',
        stages: {
            INITIAL: { Kc: 0.4, min_moisture_pct: 50, max_moisture_pct: 80, duration_days: 20 },
            DEVELOPMENT: { Kc: 0.7, min_moisture_pct: 55, max_moisture_pct: 85, duration_days: 30 },
            MID_SEASON: { Kc: 1.0, min_moisture_pct: 60, max_moisture_pct: 85, duration_days: 40 },
            LATE_SEASON: { Kc: 0.75, min_moisture_pct: 50, max_moisture_pct: 75, duration_days: 20 },
            HARVEST_READY: { Kc: 0.6, min_moisture_pct: 45, max_moisture_pct: 70, duration_days: 10 }
        }
    },
    muskmelon: {
        name_hi: 'खरबूजा',
        name_en: 'Muskmelon',
        season: 'SUMMER',
        stages: {
            INITIAL: { Kc: 0.4, min_moisture_pct: 50, max_moisture_pct: 80, duration_days: 20 },
            DEVELOPMENT: { Kc: 0.7, min_moisture_pct: 55, max_moisture_pct: 85, duration_days: 30 },
            MID_SEASON: { Kc: 0.95, min_moisture_pct: 60, max_moisture_pct: 85, duration_days: 35 },
            LATE_SEASON: { Kc: 0.75, min_moisture_pct: 50, max_moisture_pct: 75, duration_days: 20 },
            HARVEST_READY: { Kc: 0.6, min_moisture_pct: 45, max_moisture_pct: 70, duration_days: 10 }
        }
    },
    apple: {
        name_hi: 'सेब',
        name_en: 'Apple',
        season: 'PERENNIAL',
        stages: {
            INITIAL: { Kc: 0.4, min_moisture_pct: 50, max_moisture_pct: 80, duration_days: 50 },
            DEVELOPMENT: { Kc: 0.7, min_moisture_pct: 55, max_moisture_pct: 85, duration_days: 70 },
            MID_SEASON: { Kc: 0.95, min_moisture_pct: 60, max_moisture_pct: 85, duration_days: 90 },
            LATE_SEASON: { Kc: 0.75, min_moisture_pct: 55, max_moisture_pct: 80, duration_days: 50 },
            HARVEST_READY: { Kc: 0.6, min_moisture_pct: 50, max_moisture_pct: 75, duration_days: 20 }
        }
    },
    orange: {
        name_hi: 'संतरा',
        name_en: 'Orange',
        season: 'PERENNIAL',
        stages: {
            INITIAL: { Kc: 0.4, min_moisture_pct: 50, max_moisture_pct: 80, duration_days: 60 },
            DEVELOPMENT: { Kc: 0.7, min_moisture_pct: 55, max_moisture_pct: 85, duration_days: 90 },
            MID_SEASON: { Kc: 0.9, min_moisture_pct: 60, max_moisture_pct: 85, duration_days: 120 },
            LATE_SEASON: { Kc: 0.75, min_moisture_pct: 55, max_moisture_pct: 80, duration_days: 60 },
            HARVEST_READY: { Kc: 0.6, min_moisture_pct: 50, max_moisture_pct: 75, duration_days: 30 }
        }
    },
    papaya: {
        name_hi: 'पपीता',
        name_en: 'Papaya',
        season: 'PERENNIAL',
        stages: {
            INITIAL: { Kc: 0.5, min_moisture_pct: 55, max_moisture_pct: 85, duration_days: 60 },
            DEVELOPMENT: { Kc: 0.8, min_moisture_pct: 60, max_moisture_pct: 90, duration_days: 90 },
            MID_SEASON: { Kc: 1.05, min_moisture_pct: 65, max_moisture_pct: 90, duration_days: 120 },
            LATE_SEASON: { Kc: 0.85, min_moisture_pct: 60, max_moisture_pct: 85, duration_days: 60 },
            HARVEST_READY: { Kc: 0.7, min_moisture_pct: 55, max_moisture_pct: 80, duration_days: 30 }
        }
    },
    coconut: {
        name_hi: 'नारियल',
        name_en: 'Coconut',
        season: 'PERENNIAL',
        stages: {
            INITIAL: { Kc: 0.5, min_moisture_pct: 55, max_moisture_pct: 85, duration_days: 90 },
            DEVELOPMENT: { Kc: 0.8, min_moisture_pct: 60, max_moisture_pct: 90, duration_days: 150 },
            MID_SEASON: { Kc: 1.0, min_moisture_pct: 65, max_moisture_pct: 90, duration_days: 200 },
            LATE_SEASON: { Kc: 0.9, min_moisture_pct: 60, max_moisture_pct: 85, duration_days: 100 },
            HARVEST_READY: { Kc: 0.8, min_moisture_pct: 55, max_moisture_pct: 80, duration_days: 60 }
        }
    },
    cotton: {
        name_hi: 'कपास',
        name_en: 'Cotton',
        season: 'KHARIF',
        stages: {
            INITIAL: { Kc: 0.35, min_moisture_pct: 45, max_moisture_pct: 75, duration_days: 30 },
            DEVELOPMENT: { Kc: 0.7, min_moisture_pct: 50, max_moisture_pct: 80, duration_days: 50 },
            MID_SEASON: { Kc: 1.15, min_moisture_pct: 55, max_moisture_pct: 80, duration_days: 60 },
            LATE_SEASON: { Kc: 0.7, min_moisture_pct: 45, max_moisture_pct: 70, duration_days: 45 },
            HARVEST_READY: { Kc: 0.5, min_moisture_pct: 40, max_moisture_pct: 65, duration_days: 15 }
        }
    },
    jute: {
        name_hi: 'जूट',
        name_en: 'Jute',
        season: 'KHARIF',
        stages: {
            INITIAL: { Kc: 0.35, min_moisture_pct: 50, max_moisture_pct: 80, duration_days: 25 },
            DEVELOPMENT: { Kc: 0.7, min_moisture_pct: 55, max_moisture_pct: 85, duration_days: 35 },
            MID_SEASON: { Kc: 1.05, min_moisture_pct: 60, max_moisture_pct: 85, duration_days: 50 },
            LATE_SEASON: { Kc: 0.65, min_moisture_pct: 50, max_moisture_pct: 75, duration_days: 30 },
            HARVEST_READY: { Kc: 0.5, min_moisture_pct: 45, max_moisture_pct: 70, duration_days: 10 }
        }
    },
    coffee: {
        name_hi: 'कॉफी',
        name_en: 'Coffee',
        season: 'PERENNIAL',
        stages: {
            INITIAL: { Kc: 0.5, min_moisture_pct: 55, max_moisture_pct: 85, duration_days: 60 },
            DEVELOPMENT: { Kc: 0.8, min_moisture_pct: 60, max_moisture_pct: 90, duration_days: 90 },
            MID_SEASON: { Kc: 0.95, min_moisture_pct: 65, max_moisture_pct: 90, duration_days: 120 },
            LATE_SEASON: { Kc: 0.8, min_moisture_pct: 60, max_moisture_pct: 85, duration_days: 60 },
            HARVEST_READY: { Kc: 0.7, min_moisture_pct: 55, max_moisture_pct: 80, duration_days: 30 }
        }
    }
} as const;

/**
 * Soil-specific water holding capacity
 */
export const SOIL_PARAMETERS = {
    SANDY: { fieldCapacity_pct: 15, wiltingPoint_pct: 8, rootingDepth_cm: 60 },
    LOAM: { fieldCapacity_pct: 25, wiltingPoint_pct: 12, rootingDepth_cm: 70 },
    CLAY_LOAM: { fieldCapacity_pct: 35, wiltingPoint_pct: 18, rootingDepth_cm: 80 }
} as const;

/**
 * Irrigation decision thresholds
 */
export const IRRIGATION_THRESHOLDS = {
    RAIN_FORECAST_THRESHOLD_MM: 20,
    MOISTURE_CRITICAL_PCT: 40,
    MOISTURE_OPTIMAL_PCT: 85,
    CHECK_INTERVAL_HOURS: 24
} as const;


export interface IrrigationInput {
    fieldId: number;
    cropName: string;
    soilType: 'SANDY' | 'LOAM' | 'CLAY_LOAM';
    currentMoisturePct: number;
    currentTempC: number;
    latitude: number;
    longitude: number;
    sowingDate: Date;
    accumulatedGDD: number;
}

export interface IrrigationDecision {
    shouldIrrigate: boolean;
    recommendedDepthMm: number;
    reason_en: string;
    reason_hi: string;
    nextCheckHours: number;
    confidence: number;
    ruleTriggered: string;
    irrigationPattern?: {
        type: 'drip' | 'sprinkler' | 'flood' | 'skip';
        duration_minutes?: number;
        notes: string;
    };
    weatherForecast?: {
        next3DaysRainMm: number;
        avgTempNext7Days: number;
    };
    growthStageInfo?: {
        stage: GrowthStage;
        progress: number;
        Kc: number;
    };
}

export async function decideIrrigation(
    input: IrrigationInput,
    prisma: PrismaClient
): Promise<IrrigationDecision> {
    console.log(`\n🌾 Making irrigation decision for field ${input.fieldId} (${input.cropName})...`);

    // Get crop parameters
    const normalizedCrop = input.cropName.toLowerCase() as keyof typeof CROP_PARAMETERS;
    const cropParams = CROP_PARAMETERS[normalizedCrop];

    if (!cropParams) {
        console.warn(`⚠️  Crop '${input.cropName}' not found in irrigation engine (normalized: ${normalizedCrop})`);
        return {
            shouldIrrigate: false,
            recommendedDepthMm: 0,
            reason_en: `Crop '${input.cropName}' configuration is being updated. Check again later.`,
            reason_hi: `फसल '${input.cropName}' की जानकारी अपडेट हो रही है। बाद में जांचें।`,
            nextCheckHours: 24,
            confidence: 0,
            ruleTriggered: 'UNSUPPORTED_CROP'
        };
    }

    // Get weather forecast
    let weatherData: WeatherData;
    try {
        weatherData = await fetchWeatherWithCache(input.latitude, input.longitude);
    } catch (error) {
        console.warn('⚠️  Weather fetch failed, using fallback decision');
        return fallbackDecision(input, cropParams);
    }

    const next3DaysRain = getCumulativeRainfall({
        ...weatherData,
        forecast_7day: weatherData.forecast_7day.slice(0, 3)
    });

    const avgTempNext7Days = weatherData.forecast_7day.reduce(
        (sum, day) => sum + (day.temp_max_c + day.temp_min_c) / 2, 0
    ) / weatherData.forecast_7day.length;

    // Get growth stage from GDD
    const daysElapsed = Math.floor(
        (Date.now() - input.sowingDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const growthInfo = getGrowthStageInfo(
        input.cropName,
        input.accumulatedGDD,
        daysElapsed,
        20
    );

    const stageParams = cropParams.stages[growthInfo.stage];

    console.log(`   📊 Growth stage: ${growthInfo.stage} (${growthInfo.progress.toFixed(1)}%)`);
    console.log(`   💧 Moisture: ${input.currentMoisturePct}% (optimal: ${stageParams.min_moisture_pct}-${stageParams.max_moisture_pct}%)`);
    console.log(`   🌧️  Rain forecast (3 days): ${next3DaysRain.toFixed(1)} mm`);


    // RULE 1: High moisture - No irrigation needed
    if (input.currentMoisturePct >= IRRIGATION_THRESHOLDS.MOISTURE_OPTIMAL_PCT) {
        return {
            shouldIrrigate: false,
            recommendedDepthMm: 0,
            reason_en: `Soil moisture is optimal (${input.currentMoisturePct}%). No irrigation needed.`,
            reason_hi: `मिट्टी की नमी पर्याप्त है (${input.currentMoisturePct}%)। सिंचाई की जरूरत नहीं।`,
            nextCheckHours: 48,
            confidence: 0.95,
            ruleTriggered: 'HIGH_MOISTURE',
            irrigationPattern: { type: 'skip', notes: 'Soil saturated' },
            weatherForecast: { next3DaysRainMm: next3DaysRain, avgTempNext7Days },
            growthStageInfo: { stage: growthInfo.stage, progress: growthInfo.progress, Kc: stageParams.Kc }
        };
    }

    // RULE 2: Significant rain expected + current moisture acceptable
    if (
        next3DaysRain >= IRRIGATION_THRESHOLDS.RAIN_FORECAST_THRESHOLD_MM &&
        input.currentMoisturePct >= stageParams.min_moisture_pct
    ) {
        return {
            shouldIrrigate: false,
            recommendedDepthMm: 0,
            reason_en: `${next3DaysRain.toFixed(1)} mm rain expected in 3 days. Postpone irrigation.`,
            reason_hi: `अगले 3 दिनों में ${next3DaysRain.toFixed(1)} मिमी बारिश की संभावना। सिंचाई टालें।`,
            nextCheckHours: 72,
            confidence: 0.85,
            ruleTriggered: 'SUFFICIENT_RAIN_FORECAST',
            irrigationPattern: { type: 'skip', notes: 'Wait for natural rainfall' },
            weatherForecast: { next3DaysRainMm: next3DaysRain, avgTempNext7Days },
            growthStageInfo: { stage: growthInfo.stage, progress: growthInfo.progress, Kc: stageParams.Kc }
        };
    }

    // RULE 3: Critical low moisture + critical growth stage
    if (
        input.currentMoisturePct < IRRIGATION_THRESHOLDS.MOISTURE_CRITICAL_PCT &&
        growthInfo.stage === 'MID_SEASON'
    ) {
        const requiredDepth = calculateRequiredDepth(
            input.currentMoisturePct,
            stageParams.max_moisture_pct,
            input.soilType
        );

        return {
            shouldIrrigate: true,
            recommendedDepthMm: requiredDepth,
            reason_en: `CRITICAL: Low moisture (${input.currentMoisturePct}%) during peak growth. Immediate irrigation required.`,
            reason_hi: `गंभीर: फूल आने के समय कम नमी (${input.currentMoisturePct}%)। तुरंत सिंचाई करें।`,
            nextCheckHours: 168,
            confidence: 0.95,
            ruleTriggered: 'CRITICAL_LOW_MOISTURE_MID_SEASON',
            irrigationPattern: {
                type: 'drip',
                duration_minutes: Math.round(requiredDepth * 2.5),
                notes: `Apply ${requiredDepth.toFixed(1)} mm to reach optimal moisture`
            },
            weatherForecast: { next3DaysRainMm: next3DaysRain, avgTempNext7Days },
            growthStageInfo: { stage: growthInfo.stage, progress: growthInfo.progress, Kc: stageParams.Kc }
        };
    }

    // RULE 4: Below minimum threshold for current stage
    if (input.currentMoisturePct < stageParams.min_moisture_pct) {
        const requiredDepth = calculateRequiredDepth(
            input.currentMoisturePct,
            stageParams.max_moisture_pct,
            input.soilType
        );

        return {
            shouldIrrigate: true,
            recommendedDepthMm: requiredDepth,
            reason_en: `Moisture below stage minimum (${input.currentMoisturePct}% < ${stageParams.min_moisture_pct}%). Irrigation needed.`,
            reason_hi: `नमी न्यूनतम से कम है (${input.currentMoisturePct}% < ${stageParams.min_moisture_pct}%)। सिंचाई करें।`,
            nextCheckHours: 120,
            confidence: 0.85,
            ruleTriggered: 'BELOW_STAGE_MINIMUM',
            irrigationPattern: {
                type: stageParams.Kc > 1.0 ? 'drip' : 'sprinkler',
                duration_minutes: Math.round(requiredDepth * 2),
                notes: `Restore to optimal range`
            },
            weatherForecast: { next3DaysRainMm: next3DaysRain, avgTempNext7Days },
            growthStageInfo: { stage: growthInfo.stage, progress: growthInfo.progress, Kc: stageParams.Kc }
        };
    }

    // RULE 5: High Kc (water demand) + moderate moisture
    if (
        stageParams.Kc > 1.0 &&
        input.currentMoisturePct < (stageParams.min_moisture_pct + stageParams.max_moisture_pct) / 2
    ) {
        const lightDepth = calculateRequiredDepth(
            input.currentMoisturePct,
            (stageParams.min_moisture_pct + stageParams.max_moisture_pct) / 2,
            input.soilType
        );

        return {
            shouldIrrigate: true,
            recommendedDepthMm: lightDepth,
            reason_en: `High water demand stage (Kc=${stageParams.Kc}). Light irrigation recommended.`,
            reason_hi: `फसल को अधिक पानी की जरूरत (Kc=${stageParams.Kc})। हल्की सिंचाई करें।`,
            nextCheckHours: 96,
            confidence: 0.75,
            ruleTriggered: 'HIGH_KC_MODERATE_MOISTURE',
            irrigationPattern: {
                type: 'drip',
                duration_minutes: Math.round(lightDepth * 2),
                notes: 'Light application to sustain peak growth'
            },
            weatherForecast: { next3DaysRainMm: next3DaysRain, avgTempNext7Days },
            growthStageInfo: { stage: growthInfo.stage, progress: growthInfo.progress, Kc: stageParams.Kc }
        };
    }

    // DEFAULT RULE: Conditions stable, monitor
    return {
        shouldIrrigate: false,
        recommendedDepthMm: 0,
        reason_en: `Conditions stable. Moisture ${input.currentMoisturePct}% is acceptable for ${growthInfo.stage} stage.`,
        reason_hi: `स्थिति स्थिर है। ${growthInfo.stage} चरण के लिए ${input.currentMoisturePct}% नमी ठीक है।`,
        nextCheckHours: 24,
        confidence: 0.65,
        ruleTriggered: 'STABLE_CONDITIONS',
        irrigationPattern: { type: 'skip', notes: 'Continue monitoring daily' },
        weatherForecast: { next3DaysRainMm: next3DaysRain, avgTempNext7Days },
        growthStageInfo: { stage: growthInfo.stage, progress: growthInfo.progress, Kc: stageParams.Kc }
    };
}

function calculateRequiredDepth(
    currentMoisturePct: number,
    targetMoisturePct: number,
    soilType: 'SANDY' | 'LOAM' | 'CLAY_LOAM'
): number {
    const soilParams = SOIL_PARAMETERS[soilType];

    const availableWater = (soilParams.fieldCapacity_pct - soilParams.wiltingPoint_pct) *
        (soilParams.rootingDepth_cm / 10);

    const deficitDepthMm = ((targetMoisturePct - currentMoisturePct) / 100) * availableWater;

    return Math.max(10, Math.min(50, Math.round(deficitDepthMm)));
}

function fallbackDecision(
    input: IrrigationInput,
    cropParams: typeof CROP_PARAMETERS[keyof typeof CROP_PARAMETERS]
): IrrigationDecision {
    const daysElapsed = Math.floor(
        (Date.now() - input.sowingDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const growthInfo = getGrowthStageInfo(input.cropName, input.accumulatedGDD, daysElapsed, 20);
    const stageParams = cropParams.stages[growthInfo.stage];

    if (input.currentMoisturePct < stageParams.min_moisture_pct) {
        return {
            shouldIrrigate: true,
            recommendedDepthMm: 25,
            reason_en: `Moisture low (${input.currentMoisturePct}%). Weather data unavailable, using conservative irrigation.`,
            reason_hi: `नमी कम (${input.currentMoisturePct}%)। मौसम डेटा उपलब्ध नहीं, सावधानी से सिंचाई करें।`,
            nextCheckHours: 48,
            confidence: 0.6,
            ruleTriggered: 'FALLBACK_LOW_MOISTURE',
            irrigationPattern: {
                type: 'sprinkler',
                duration_minutes: 50,
                notes: 'Conservative application due to missing weather data'
            }
        };
    }

    return {
        shouldIrrigate: false,
        recommendedDepthMm: 0,
        reason_en: `Moisture adequate. Weather data unavailable, monitor closely.`,
        reason_hi: `नमी पर्याप्त है। मौसम डेटा उपलब्ध नहीं, निगरानी रखें।`,
        nextCheckHours: 24,
        confidence: 0.5,
        ruleTriggered: 'FALLBACK_STABLE',
        irrigationPattern: { type: 'skip', notes: 'Check weather manually' }
    };
}
