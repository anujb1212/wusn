const cropRequirements = {
    wheat: {
        moistureMin: 350,
        moistureMax: 700,
        moistureIdeal: 500,
        tempMin: 15,
        tempMax: 25,
        tempIdeal: 20
    },
    rice: {
        moistureMin: 600,
        moistureMax: 900,
        moistureIdeal: 750,
        tempMin: 20,
        tempMax: 35,
        tempIdeal: 28
    },
    vegetables: {
        moistureMin: 400,
        moistureMax: 750,
        moistureIdeal: 575,
        tempMin: 18,
        tempMax: 30,
        tempIdeal: 24
    },
    bajra: {
        moistureMin: 250,
        moistureMax: 600,
        moistureIdeal: 425,
        tempMin: 25,
        tempMax: 40,
        tempIdeal: 32
    }
};
function calculateSuitability(moisture, temperature, cropName) {
    const req = cropRequirements[cropName];
    let moistureScore = 0;
    if (moisture >= req.moistureMin && moisture <= req.moistureMax) {
        const distanceFromIdeal = Math.abs(moisture - req.moistureIdeal);
        const maxDistance = (req.moistureMax - req.moistureMin) / 2;
        moistureScore = 50 * (1 - distanceFromIdeal / maxDistance);
    }
    let tempScore = 0;
    if (temperature >= req.tempMin && temperature <= req.tempMax) {
        const distanceFromIdeal = Math.abs(temperature - req.tempIdeal);
        const maxDistance = (req.tempMax - req.tempMin) / 2;
        tempScore = 50 * (1 - distanceFromIdeal / maxDistance);
    }
    return Math.max(0, Math.round(moistureScore + tempScore));
}
export function recommendCrop(moisture, temperature) {
    const cropNames = ['wheat', 'rice', 'vegetables', 'bajra'];
    const crops = cropNames.map(cropName => {
        const suitability = calculateSuitability(moisture, temperature, cropName);
        let reason;
        if (suitability > 80)
            reason = 'Excellent conditions';
        else if (suitability > 60)
            reason = 'Good conditions';
        else if (suitability > 40)
            reason = 'Moderate conditions';
        else
            reason = 'Poor conditions';
        return { cropName, suitability, reason };
    });
    crops.sort((a, b) => b.suitability - a.suitability);
    const bestCrop = crops[0];
    const secondBest = crops[1];
    let summary;
    if (bestCrop.suitability > 80) {
        summary = `Highly suitable for ${bestCrop.cropName}. `;
    }
    else if (bestCrop.suitability > 60) {
        summary = `Suitable for ${bestCrop.cropName}. `;
    }
    else if (bestCrop.suitability > 40) {
        summary = `Marginal for ${bestCrop.cropName}. `;
    }
    else {
        summary = `Poor conditions for most crops. Consider soil improvement. `;
    }
    if (secondBest && secondBest.suitability > 60) {
        summary += `${secondBest.cropName} is also a good alternative.`;
    }
    return {
        bestCrop: bestCrop.cropName,
        confidence: bestCrop.suitability,
        allCrops: crops,
        summary
    };
}
//# sourceMappingURL=cropRecommendationService.js.map