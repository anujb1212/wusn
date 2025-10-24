class AppTranslations {
  static const Map<String, Map<String, String>> translations = {
    'en': {
      'appTitle': 'Soil Monitor',
      'dashboard': 'Dashboard',
      'node': 'Sensor',
      'moisture': 'Soil Water',
      'temperature': 'Temperature',
      'crop': 'Crop',
      'goodCondition': 'All Good',
      'needsWater': 'Needs Water',
      'tooWet': 'Too Wet',
      'recommendations': 'What To Do',
      'lastUpdated': 'Last Checked',
      'loading': 'Loading data...',
      'error': 'Error loading data',
      'retry': 'Tap to retry',
      'realtime': 'Live updates',
      'offline': 'Offline',
      'noData': 'No sensor data available',
      'updated': 'updated',
      'pullToRefresh': 'Pull to refresh',
    },
    'hi': {
      'appTitle': 'खेत की नमी',
      'dashboard': 'मुख्य पेज',
      'node': 'सेंसर',
      'moisture': 'मिट्टी में पानी',
      'temperature': 'गर्मी',
      'crop': 'फसल',
      'goodCondition': 'सब ठीक है',
      'needsWater': 'पानी चाहिए',
      'tooWet': 'ज्यादा गीला',
      'recommendations': 'क्या करें',
      'lastUpdated': 'आखरी बार देखा',
      'loading': 'डेटा लोड हो रहा है...',
      'error': 'डेटा लोड करने में त्रुटि',
      'retry': 'दोबारा कोशिश करें',
      'realtime': 'लाइव अपडेट',
      'offline': 'ऑफलाइन',
      'noData': 'कोई डेटा नहीं',
      'updated': 'अपडेट हुआ',
      'pullToRefresh': 'रिफ्रेश करने के लिए खींचें',
    },
  };

  static String translate(String key, String language) {
    return translations[language]?[key] ?? key;
  }
}
