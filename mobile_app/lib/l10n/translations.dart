class AppTranslations {
  static const Map<String, Map<String, String>> translations = {
    'en': {
      // App Title
      'appTitle': 'Soil Monitor',
      'dashboard': 'Dashboard',
      
      // Node Info
      'node': 'Sensor',
      'crop': 'Crop',
      
      // Sensor Readings
      'moisture': 'Soil Moisture',
      'temperature': 'Temperature',
      
      // Status
      'goodCondition': 'All Good',
      'needsWater': 'Needs Water',
      'tooWet': 'Too Wet',
      'unknown': 'Unknown',
      
      // Recommendations
      'recommendations': 'What To Do',
      'irrigationAdvice': 'Irrigation Advice',
      'bestCrop': 'Best Crop',
      'cropSuitability': 'Crop Suitability',
      
      // Fuzzy Analysis (NEW)
      'fuzzyAnalysis': 'Soil Analysis',
      'confidence': 'Confidence',
      'dry': 'Dry',
      'optimal': 'Optimal',
      'wet': 'Wet',
      
      // Time
      'lastUpdated': 'Last Checked',
      'updated': 'Updated',
      'timeAgo': 'ago',
      
      // UI Actions
      'loading': 'Loading data...',
      'error': 'Error loading data',
      'retry': 'Tap to retry',
      'pullToRefresh': 'Pull to refresh',
      
      // Connection Status
      'realtime': 'Live Updates',
      'offline': 'Offline',
      'connected': 'Connected',
      'connecting': 'Connecting...',
      
      // Empty States
      'noData': 'No sensor data available',
      'noAlerts': 'No alerts',
      
      // Units
      'smu': 'SMU',
      'celsius': '°C',
      'dbm': 'dBm',
    },
    'hi': {
      // App Title
      'appTitle': '[translate:खेत की नमी]',
      'dashboard': '[translate:मुख्य पेज]',
      
      // Node Info
      'node': '[translate:सेंसर]',
      'crop': '[translate:फसल]',
      
      // Sensor Readings
      'moisture': '[translate:मिट्टी में पानी]',
      'temperature': '[translate:तापमान]',
      
      // Status
      'goodCondition': '[translate:सब ठीक है]',
      'needsWater': '[translate:पानी चाहिए]',
      'tooWet': '[translate:ज्यादा गीला]',
      'unknown': '[translate:अज्ञात]',
      
      // Recommendations
      'recommendations': '[translate:क्या करें]',
      'irrigationAdvice': '[translate:सिंचाई सलाह]',
      'bestCrop': '[translate:सबसे अच्छी फसल]',
      'cropSuitability': '[translate:फसल उपयुक्तता]',
      
      // Fuzzy Analysis (NEW)
      'fuzzyAnalysis': '[translate:मिट्टी विश्लेषण]',
      'confidence': '[translate:विश्वास]',
      'dry': '[translate:सूखा]',
      'optimal': '[translate:उत्तम]',
      'wet': '[translate:गीला]',
      
      // Time
      'lastUpdated': '[translate:आखरी बार देखा]',
      'updated': '[translate:अपडेट हुआ]',
      'timeAgo': '[translate:पहले]',
      
      // UI Actions
      'loading': '[translate:डेटा लोड हो रहा है...]',
      'error': '[translate:डेटा लोड करने में त्रुटि]',
      'retry': '[translate:दोबारा कोशिश करें]',
      'pullToRefresh': '[translate:रिफ्रेश करने के लिए खींचें]',
      
      // Connection Status
      'realtime': '[translate:लाइव अपडेट]',
      'offline': '[translate:ऑफलाइन]',
      'connected': '[translate:जुड़ा हुआ]',
      'connecting': '[translate:जुड़ रहा है...]',
      
      // Empty States
      'noData': '[translate:कोई डेटा नहीं]',
      'noAlerts': '[translate:कोई चेतावनी नहीं]',
      
      // Units (Keep English for technical terms)
      'smu': 'SMU',
      'celsius': '°C',
      'dbm': 'dBm',
    },
  };

  static String translate(String key, String language) {
    // Default to English if key not found
    return translations[language]?[key] ?? 
           translations['en']?[key] ?? 
           key;
  }
}
