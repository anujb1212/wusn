export const irrigationTranslations = {
    'Critical: Irrigate immediately within 12 hours. Soil moisture critically low.': 'गंभीर: 12 घंटे के भीतर तुरंत सिंचाई करें। मिट्टी की नमी बहुत कम है।',
    'Moderate: Irrigation recommended within 24-48 hours. Monitor daily.': 'मध्यम: 24-48 घंटे के भीतर सिंचाई की सिफारिश। रोज निगरानी करें।',
    'Mild: Approaching dry zone. Plan irrigation within 2-3 days.': 'हल्का: सूखे क्षेत्र की ओर बढ़ रहा है। 2-3 दिनों में सिंचाई की योजना बनाएं।',
    'Critical: Stop irrigation immediately. Check drainage system. Root damage risk.': 'गंभीर: तुरंत सिंचाई बंद करें। जल निकासी प्रणाली जांचें। जड़ों को नुकसान का खतरा।',
    'Caution: Reduce irrigation frequency. Monitor for 2-3 days before next watering.': 'सावधान: सिंचाई की आवृत्ति कम करें। अगली सिंचाई से पहले 2-3 दिनों तक निगरानी करें।',
    'Good: Currently optimal but drying trend detected. Monitor closely for next 24 hours.': 'अच्छा: वर्तमान में उत्तम लेकिन सूखने की प्रवृत्ति पाई गई। अगले 24 घंटों के लिए बारीकी से निगरानी करें।',
    'Good: Currently optimal but approaching wet zone. Reduce irrigation frequency.': 'अच्छा: वर्तमान में उत्तम लेकिन गीले क्षेत्र की ओर बढ़ रहा है। सिंचाई की आवृत्ति कम करें।',
    'Excellent: Perfect soil conditions. Maintain current irrigation schedule.': 'उत्कृष्ट: मिट्टी की स्थिति बिल्कुल सही। वर्तमान सिंचाई कार्यक्रम बनाए रखें।',
};
export const cropSummaryPatterns = [
    {
        en: /Rabi \(Winter\) season: Highly suitable for (.+)\./,
        hi: 'रबी (सर्दी) मौसम: $1 के लिए अत्यधिक उपयुक्त।'
    },
    {
        en: /Kharif \(Monsoon\) season: Highly suitable for (.+)\./,
        hi: 'खरीफ (मानसून) मौसम: $1 के लिए अत्यधिक उपयुक्त।'
    },
    {
        en: /Rabi \(Winter\) season: Suitable for (.+)\./,
        hi: 'रबी (सर्दी) मौसम: $1 के लिए उपयुक्त।'
    },
    {
        en: /Kharif \(Monsoon\) season: Suitable for (.+)\./,
        hi: 'खरीफ (मानसून) मौसम: $1 के लिए उपयुक्त।'
    },
    {
        en: /Alternatives: (.+)\./,
        hi: 'विकल्प: $1।'
    },
];
export function translateIrrigation(text) {
    return irrigationTranslations[text] || text;
}
export function translateSummary(text, cropNameHi) {
    for (const pattern of cropSummaryPatterns) {
        const match = text.match(pattern.en);
        if (match) {
            return pattern.hi.replace('$1', cropNameHi);
        }
    }
    return text;
}
//# sourceMappingURL=irrigationTranslations.js.map