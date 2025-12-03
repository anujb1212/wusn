import type { PrismaClient } from '@prisma/client';
import { type GrowthStage } from './gddService.js';
/**
 * Crop-specific irrigation parameters for ALL dataset crops
 * Kc = Crop coefficient (water requirement multiplier)
 * min/max_moisture_pct = Optimal soil moisture range for each growth stage
 */
export declare const CROP_PARAMETERS: {
    readonly rice: {
        readonly name_hi: "चावल";
        readonly name_en: "Rice";
        readonly season: "KHARIF";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.5;
                readonly min_moisture_pct: 75;
                readonly max_moisture_pct: 100;
                readonly duration_days: 30;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.8;
                readonly min_moisture_pct: 80;
                readonly max_moisture_pct: 100;
                readonly duration_days: 30;
            };
            readonly MID_SEASON: {
                readonly Kc: 1.2;
                readonly min_moisture_pct: 85;
                readonly max_moisture_pct: 100;
                readonly duration_days: 80;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.8;
                readonly min_moisture_pct: 75;
                readonly max_moisture_pct: 100;
                readonly duration_days: 30;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.5;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 90;
                readonly duration_days: 10;
            };
        };
    };
    readonly maize: {
        readonly name_hi: "मक्का";
        readonly name_en: "Maize";
        readonly season: "KHARIF";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.3;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 80;
                readonly duration_days: 25;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.7;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 85;
                readonly duration_days: 35;
            };
            readonly MID_SEASON: {
                readonly Kc: 1.2;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 85;
                readonly duration_days: 50;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.6;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 75;
                readonly duration_days: 30;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.4;
                readonly min_moisture_pct: 40;
                readonly max_moisture_pct: 70;
                readonly duration_days: 10;
            };
        };
    };
    readonly chickpea: {
        readonly name_hi: "चना";
        readonly name_en: "Chickpea";
        readonly season: "RABI";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.3;
                readonly min_moisture_pct: 45;
                readonly max_moisture_pct: 75;
                readonly duration_days: 25;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.7;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 80;
                readonly duration_days: 35;
            };
            readonly MID_SEASON: {
                readonly Kc: 1;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 80;
                readonly duration_days: 50;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.5;
                readonly min_moisture_pct: 45;
                readonly max_moisture_pct: 70;
                readonly duration_days: 25;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.3;
                readonly min_moisture_pct: 40;
                readonly max_moisture_pct: 65;
                readonly duration_days: 10;
            };
        };
    };
    readonly kidneybeans: {
        readonly name_hi: "राजमा";
        readonly name_en: "Kidney Beans";
        readonly season: "KHARIF";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.3;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 80;
                readonly duration_days: 20;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.7;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 85;
                readonly duration_days: 30;
            };
            readonly MID_SEASON: {
                readonly Kc: 1.05;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 85;
                readonly duration_days: 40;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.65;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 75;
                readonly duration_days: 25;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.4;
                readonly min_moisture_pct: 40;
                readonly max_moisture_pct: 70;
                readonly duration_days: 10;
            };
        };
    };
    readonly pigeonpeas: {
        readonly name_hi: "अरहर";
        readonly name_en: "Pigeon Peas";
        readonly season: "KHARIF";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.3;
                readonly min_moisture_pct: 45;
                readonly max_moisture_pct: 75;
                readonly duration_days: 30;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.7;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 80;
                readonly duration_days: 40;
            };
            readonly MID_SEASON: {
                readonly Kc: 1;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 80;
                readonly duration_days: 60;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.6;
                readonly min_moisture_pct: 45;
                readonly max_moisture_pct: 70;
                readonly duration_days: 30;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.4;
                readonly min_moisture_pct: 40;
                readonly max_moisture_pct: 65;
                readonly duration_days: 10;
            };
        };
    };
    readonly mothbeans: {
        readonly name_hi: "मोठ";
        readonly name_en: "Moth Beans";
        readonly season: "KHARIF";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.3;
                readonly min_moisture_pct: 45;
                readonly max_moisture_pct: 75;
                readonly duration_days: 20;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.7;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 80;
                readonly duration_days: 30;
            };
            readonly MID_SEASON: {
                readonly Kc: 1.05;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 80;
                readonly duration_days: 40;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.6;
                readonly min_moisture_pct: 45;
                readonly max_moisture_pct: 70;
                readonly duration_days: 20;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.4;
                readonly min_moisture_pct: 40;
                readonly max_moisture_pct: 65;
                readonly duration_days: 10;
            };
        };
    };
    readonly mungbean: {
        readonly name_hi: "मूंग";
        readonly name_en: "Mung Bean";
        readonly season: "KHARIF";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.3;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 80;
                readonly duration_days: 20;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.7;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 85;
                readonly duration_days: 25;
            };
            readonly MID_SEASON: {
                readonly Kc: 1.05;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 85;
                readonly duration_days: 35;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.65;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 75;
                readonly duration_days: 20;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.4;
                readonly min_moisture_pct: 40;
                readonly max_moisture_pct: 70;
                readonly duration_days: 10;
            };
        };
    };
    readonly blackgram: {
        readonly name_hi: "उड़द";
        readonly name_en: "Black Gram";
        readonly season: "KHARIF";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.3;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 80;
                readonly duration_days: 20;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.7;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 85;
                readonly duration_days: 25;
            };
            readonly MID_SEASON: {
                readonly Kc: 1.05;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 85;
                readonly duration_days: 35;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.65;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 75;
                readonly duration_days: 20;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.4;
                readonly min_moisture_pct: 40;
                readonly max_moisture_pct: 70;
                readonly duration_days: 10;
            };
        };
    };
    readonly lentil: {
        readonly name_hi: "मसूर";
        readonly name_en: "Lentil";
        readonly season: "RABI";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.3;
                readonly min_moisture_pct: 45;
                readonly max_moisture_pct: 75;
                readonly duration_days: 25;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.7;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 80;
                readonly duration_days: 35;
            };
            readonly MID_SEASON: {
                readonly Kc: 1;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 80;
                readonly duration_days: 50;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.5;
                readonly min_moisture_pct: 45;
                readonly max_moisture_pct: 70;
                readonly duration_days: 25;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.3;
                readonly min_moisture_pct: 40;
                readonly max_moisture_pct: 65;
                readonly duration_days: 10;
            };
        };
    };
    readonly pomegranate: {
        readonly name_hi: "अनार";
        readonly name_en: "Pomegranate";
        readonly season: "PERENNIAL";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.3;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 80;
                readonly duration_days: 40;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.6;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 85;
                readonly duration_days: 60;
            };
            readonly MID_SEASON: {
                readonly Kc: 0.9;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 85;
                readonly duration_days: 100;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.7;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 80;
                readonly duration_days: 50;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.5;
                readonly min_moisture_pct: 45;
                readonly max_moisture_pct: 75;
                readonly duration_days: 20;
            };
        };
    };
    readonly banana: {
        readonly name_hi: "केला";
        readonly name_en: "Banana";
        readonly season: "PERENNIAL";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.5;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 90;
                readonly duration_days: 60;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.8;
                readonly min_moisture_pct: 65;
                readonly max_moisture_pct: 90;
                readonly duration_days: 90;
            };
            readonly MID_SEASON: {
                readonly Kc: 1.1;
                readonly min_moisture_pct: 70;
                readonly max_moisture_pct: 95;
                readonly duration_days: 120;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.9;
                readonly min_moisture_pct: 65;
                readonly max_moisture_pct: 90;
                readonly duration_days: 60;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.75;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 85;
                readonly duration_days: 30;
            };
        };
    };
    readonly mango: {
        readonly name_hi: "आम";
        readonly name_en: "Mango";
        readonly season: "PERENNIAL";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.4;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 80;
                readonly duration_days: 60;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.7;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 85;
                readonly duration_days: 90;
            };
            readonly MID_SEASON: {
                readonly Kc: 0.95;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 85;
                readonly duration_days: 120;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.75;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 80;
                readonly duration_days: 60;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.6;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 75;
                readonly duration_days: 30;
            };
        };
    };
    readonly grapes: {
        readonly name_hi: "अंगूर";
        readonly name_en: "Grapes";
        readonly season: "PERENNIAL";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.3;
                readonly min_moisture_pct: 45;
                readonly max_moisture_pct: 75;
                readonly duration_days: 40;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.6;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 80;
                readonly duration_days: 50;
            };
            readonly MID_SEASON: {
                readonly Kc: 0.85;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 80;
                readonly duration_days: 70;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.65;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 75;
                readonly duration_days: 40;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.5;
                readonly min_moisture_pct: 45;
                readonly max_moisture_pct: 70;
                readonly duration_days: 20;
            };
        };
    };
    readonly watermelon: {
        readonly name_hi: "तरबूज";
        readonly name_en: "Watermelon";
        readonly season: "SUMMER";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.4;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 80;
                readonly duration_days: 20;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.7;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 85;
                readonly duration_days: 30;
            };
            readonly MID_SEASON: {
                readonly Kc: 1;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 85;
                readonly duration_days: 40;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.75;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 75;
                readonly duration_days: 20;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.6;
                readonly min_moisture_pct: 45;
                readonly max_moisture_pct: 70;
                readonly duration_days: 10;
            };
        };
    };
    readonly muskmelon: {
        readonly name_hi: "खरबूजा";
        readonly name_en: "Muskmelon";
        readonly season: "SUMMER";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.4;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 80;
                readonly duration_days: 20;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.7;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 85;
                readonly duration_days: 30;
            };
            readonly MID_SEASON: {
                readonly Kc: 0.95;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 85;
                readonly duration_days: 35;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.75;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 75;
                readonly duration_days: 20;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.6;
                readonly min_moisture_pct: 45;
                readonly max_moisture_pct: 70;
                readonly duration_days: 10;
            };
        };
    };
    readonly apple: {
        readonly name_hi: "सेब";
        readonly name_en: "Apple";
        readonly season: "PERENNIAL";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.4;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 80;
                readonly duration_days: 50;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.7;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 85;
                readonly duration_days: 70;
            };
            readonly MID_SEASON: {
                readonly Kc: 0.95;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 85;
                readonly duration_days: 90;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.75;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 80;
                readonly duration_days: 50;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.6;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 75;
                readonly duration_days: 20;
            };
        };
    };
    readonly orange: {
        readonly name_hi: "संतरा";
        readonly name_en: "Orange";
        readonly season: "PERENNIAL";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.4;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 80;
                readonly duration_days: 60;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.7;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 85;
                readonly duration_days: 90;
            };
            readonly MID_SEASON: {
                readonly Kc: 0.9;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 85;
                readonly duration_days: 120;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.75;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 80;
                readonly duration_days: 60;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.6;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 75;
                readonly duration_days: 30;
            };
        };
    };
    readonly papaya: {
        readonly name_hi: "पपीता";
        readonly name_en: "Papaya";
        readonly season: "PERENNIAL";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.5;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 85;
                readonly duration_days: 60;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.8;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 90;
                readonly duration_days: 90;
            };
            readonly MID_SEASON: {
                readonly Kc: 1.05;
                readonly min_moisture_pct: 65;
                readonly max_moisture_pct: 90;
                readonly duration_days: 120;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.85;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 85;
                readonly duration_days: 60;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.7;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 80;
                readonly duration_days: 30;
            };
        };
    };
    readonly coconut: {
        readonly name_hi: "नारियल";
        readonly name_en: "Coconut";
        readonly season: "PERENNIAL";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.5;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 85;
                readonly duration_days: 90;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.8;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 90;
                readonly duration_days: 150;
            };
            readonly MID_SEASON: {
                readonly Kc: 1;
                readonly min_moisture_pct: 65;
                readonly max_moisture_pct: 90;
                readonly duration_days: 200;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.9;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 85;
                readonly duration_days: 100;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.8;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 80;
                readonly duration_days: 60;
            };
        };
    };
    readonly cotton: {
        readonly name_hi: "कपास";
        readonly name_en: "Cotton";
        readonly season: "KHARIF";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.35;
                readonly min_moisture_pct: 45;
                readonly max_moisture_pct: 75;
                readonly duration_days: 30;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.7;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 80;
                readonly duration_days: 50;
            };
            readonly MID_SEASON: {
                readonly Kc: 1.15;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 80;
                readonly duration_days: 60;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.7;
                readonly min_moisture_pct: 45;
                readonly max_moisture_pct: 70;
                readonly duration_days: 45;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.5;
                readonly min_moisture_pct: 40;
                readonly max_moisture_pct: 65;
                readonly duration_days: 15;
            };
        };
    };
    readonly jute: {
        readonly name_hi: "जूट";
        readonly name_en: "Jute";
        readonly season: "KHARIF";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.35;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 80;
                readonly duration_days: 25;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.7;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 85;
                readonly duration_days: 35;
            };
            readonly MID_SEASON: {
                readonly Kc: 1.05;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 85;
                readonly duration_days: 50;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.65;
                readonly min_moisture_pct: 50;
                readonly max_moisture_pct: 75;
                readonly duration_days: 30;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.5;
                readonly min_moisture_pct: 45;
                readonly max_moisture_pct: 70;
                readonly duration_days: 10;
            };
        };
    };
    readonly coffee: {
        readonly name_hi: "कॉफी";
        readonly name_en: "Coffee";
        readonly season: "PERENNIAL";
        readonly stages: {
            readonly INITIAL: {
                readonly Kc: 0.5;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 85;
                readonly duration_days: 60;
            };
            readonly DEVELOPMENT: {
                readonly Kc: 0.8;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 90;
                readonly duration_days: 90;
            };
            readonly MID_SEASON: {
                readonly Kc: 0.95;
                readonly min_moisture_pct: 65;
                readonly max_moisture_pct: 90;
                readonly duration_days: 120;
            };
            readonly LATE_SEASON: {
                readonly Kc: 0.8;
                readonly min_moisture_pct: 60;
                readonly max_moisture_pct: 85;
                readonly duration_days: 60;
            };
            readonly HARVEST_READY: {
                readonly Kc: 0.7;
                readonly min_moisture_pct: 55;
                readonly max_moisture_pct: 80;
                readonly duration_days: 30;
            };
        };
    };
};
/**
 * Soil-specific water holding capacity
 */
export declare const SOIL_PARAMETERS: {
    readonly SANDY: {
        readonly fieldCapacity_pct: 15;
        readonly wiltingPoint_pct: 8;
        readonly rootingDepth_cm: 60;
    };
    readonly LOAM: {
        readonly fieldCapacity_pct: 25;
        readonly wiltingPoint_pct: 12;
        readonly rootingDepth_cm: 70;
    };
    readonly CLAY_LOAM: {
        readonly fieldCapacity_pct: 35;
        readonly wiltingPoint_pct: 18;
        readonly rootingDepth_cm: 80;
    };
};
/**
 * Irrigation decision thresholds
 */
export declare const IRRIGATION_THRESHOLDS: {
    readonly RAIN_FORECAST_THRESHOLD_MM: 20;
    readonly MOISTURE_CRITICAL_PCT: 40;
    readonly MOISTURE_OPTIMAL_PCT: 85;
    readonly CHECK_INTERVAL_HOURS: 24;
};
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
export declare function decideIrrigation(input: IrrigationInput, prisma: PrismaClient): Promise<IrrigationDecision>;
//# sourceMappingURL=irrigationEngine.d.ts.map