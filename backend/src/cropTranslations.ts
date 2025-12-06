export const cropTranslations: Record<string, { en: string; hi: string }> = {
  rice: { en: 'Rice', hi: 'धान' },
  maize: { en: 'Maize', hi: 'मक्का' },
  wheat: { en: 'Wheat', hi: 'गेहूं' },
  chickpea: { en: 'Chickpea', hi: 'चना' },
  kidneybeans: { en: 'Kidney Beans', hi: 'राजमा' },
  pigeonpeas: { en: 'Pigeon Peas', hi: 'अरहर' },
  mothbeans: { en: 'Moth Beans', hi: 'मोठ' },
  mungbean: { en: 'Mung Bean', hi: 'मूंग' },
  blackgram: { en: 'Black Gram', hi: 'उड़द' },
  lentil: { en: 'Lentil', hi: 'मसूर' },
  pomegranate: { en: 'Pomegranate', hi: 'अनार' },
  banana: { en: 'Banana', hi: 'केला' },
  mango: { en: 'Mango', hi: 'आम' },
  grapes: { en: 'Grapes', hi: 'अंगूर' },
  watermelon: { en: 'Watermelon', hi: 'तरबूज' },
  muskmelon: { en: 'Muskmelon', hi: 'खरबूजा' },
  apple: { en: 'Apple', hi: 'सेब' },
  orange: { en: 'Orange', hi: 'संतरा' },
  papaya: { en: 'Papaya', hi: 'पपीता' },
  coconut: { en: 'Coconut', hi: 'नारियल' },
  cotton: { en: 'Cotton', hi: 'कपास' },
  jute: { en: 'Jute', hi: 'जूट' },
  coffee: { en: 'Coffee', hi: 'कॉफी' },
};

export function translateCropName(cropName: string, language: 'en' | 'hi'): string {
  const crop = cropTranslations[cropName.toLowerCase()];
  return crop ? crop[language] : cropName;
}

