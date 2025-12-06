import type { WeatherData } from './weatherService.js';
export interface IrrigationDecision {
    shouldIrrigate: boolean;
    reason: string;
    currentVWC: number;
    targetVWC: number;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    estimatedWaterNeeded: number;
    recommendedMethod?: 'drip' | 'sprinkler' | 'flood';
    durationMinutes?: number;
    nextCheckHours: number;
    confidence: number;
    ruleTriggered: string;
    growthStage?: string;
    weatherConsideration?: string;
}
export declare function makeIrrigationDecision(nodeId: number, weatherData?: WeatherData): Promise<IrrigationDecision>;
export declare function recordIrrigationAction(nodeId: number, waterAppliedMm: number): Promise<void>;
//# sourceMappingURL=irrigationEngine.d.ts.map