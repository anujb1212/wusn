export function getRecommendation(moisture, temperature, cropType) {
    const crop = cropType.toLowerCase();
    // Wheat recommendations
    if (crop === "wheat") {
        if (moisture < 400)
            return "Water now, soil is dry for wheat.";
        if (moisture > 700)
            return "Too wet for wheat, check drainage.";
        if (temperature < 15)
            return "Temperature low, wheat growth slow.";
        if (temperature > 35)
            return "Temperature too high, wheat stressed.";
        return "Conditions good for wheat.";
    }
    // Rice recommendations
    if (crop === "rice") {
        if (moisture < 600)
            return "Rice needs more water.";
        if (moisture > 900)
            return "Too much water for rice.";
        if (temperature < 20)
            return "Temperature low for rice growth.";
        if (temperature > 40)
            return "Temperature too high for rice.";
        return "Rice conditions are good.";
    }
    // Vegetables (general)
    if (crop === "vegetables" || crop === "tomato" || crop === "potato") {
        if (moisture < 450)
            return "Water vegetables now.";
        if (moisture > 750)
            return "Too much water, reduce irrigation.";
        if (temperature > 35)
            return "High temperature, provide shade.";
        return "Good conditions for vegetables.";
    }
    // Default for unknown crops
    if (moisture < 400)
        return "Soil appears dry, consider watering.";
    if (moisture > 800)
        return "Soil very wet, check drainage.";
    return "Monitor conditions regularly.";
}
//# sourceMappingURL=decisionService.js.map