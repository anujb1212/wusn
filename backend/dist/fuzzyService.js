/**
 * Triangular membership function
 * Returns value between 0 and 1
 */
function getMembership(value, low, center, high) {
    if (value <= low || value >= high)
        return 0;
    if (value <= center) {
        // Rising edge
        return (value - low) / (center - low);
    }
    else {
        // Falling edge
        return (high - value) / (high - center);
    }
}
/**
 * Analyze soil conditions using fuzzy logic
 * @param moisture - Soil moisture (0-1000 SMU)
 * @param temperature - Temperature in Celsius
 * @returns Fuzzy analysis result
 */
export function analyzeSoilConditions(moisture, temperature) {
    // Fuzzy sets for moisture (0-1000 SMU scale)
    const dryMembership = getMembership(moisture, 200, 300, 400);
    const optimalMembership = getMembership(moisture, 350, 550, 750);
    const wetMembership = getMembership(moisture, 700, 850, 1000);
    // Temperature adjustment factor
    let tempFactor = 1.0;
    if (temperature > 35) {
        tempFactor = 1.2; // Hot weather = more water needed
    }
    else if (temperature < 15) {
        tempFactor = 0.8; // Cold weather = less water needed
    }
    // Apply temperature factor to dry score
    const dryScore = Math.min(dryMembership * tempFactor, 1.0);
    const optimalScore = optimalMembership;
    const wetScore = wetMembership;
    // Decision logic (winner-takes-all)
    let recommendation;
    let confidence;
    let irrigationAdvice;
    if (dryScore > optimalScore && dryScore > wetScore) {
        recommendation = 'needs_water';
        confidence = dryScore;
        if (dryScore > 0.8) {
            irrigationAdvice = 'Critical: Irrigate immediately within 12 hours. Soil moisture critically low.';
        }
        else if (dryScore > 0.5) {
            irrigationAdvice = 'Moderate: Irrigation recommended within 24-48 hours. Monitor daily.';
        }
        else {
            irrigationAdvice = 'Mild: Approaching dry zone. Plan irrigation within 2-3 days.';
        }
    }
    else if (wetScore > optimalScore) {
        recommendation = 'too_wet';
        confidence = wetScore;
        if (wetScore > 0.7) {
            irrigationAdvice = 'Critical: Stop irrigation immediately. Check drainage system. Root damage risk.';
        }
        else {
            irrigationAdvice = 'Caution: Reduce irrigation frequency. Monitor for 2-3 days before next watering.';
        }
    }
    else {
        recommendation = 'optimal';
        confidence = optimalScore;
        if (dryScore > 0.3) {
            irrigationAdvice = 'Good: Currently optimal but drying trend detected. Monitor closely for next 24 hours.';
        }
        else if (wetScore > 0.3) {
            irrigationAdvice = 'Good: Currently optimal but approaching wet zone. Reduce irrigation frequency.';
        }
        else {
            irrigationAdvice = 'Excellent: Perfect soil conditions. Maintain current irrigation schedule.';
        }
    }
    return {
        recommendation,
        confidence: Math.round(confidence * 100),
        irrigationAdvice,
        fuzzyScores: {
            dry: Math.round(dryScore * 100),
            optimal: Math.round(optimalScore * 100),
            wet: Math.round(wetScore * 100)
        }
    };
}
//# sourceMappingURL=fuzzyService.js.map