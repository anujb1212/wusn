class AppTranslations {
  static const Map<String, Map<String, String>> translations = {
    'en': {
      'appTitle': 'Soil Monitor',
      'dashboard': 'Dashboard',
      
      'node': 'Sensor',
      'crop': 'Crop',
      
      'moisture': 'Soil Moisture',
      'temperature': 'Temperature',
      'battery': 'Battery',
      'signal': 'Signal',
      'depth': 'Depth',
      'distance': 'Distance',
      
      'goodCondition': 'All Good',
      'needsWater': 'Needs Water',
      'tooWet': 'Too Wet',
      'unknown': 'Unknown',
      
      'recommendations': 'What To Do',
      'irrigationAdvice': 'Irrigation Advice',
      'bestCrop': 'Best Crop',
      'cropSuitability': 'Crop Suitability',
      
      'fuzzyAnalysis': 'Soil Analysis',
      'confidence': 'Confidence',
      'dry': 'Dry',
      'optimal': 'Optimal',
      'wet': 'Wet',
      
      'lastUpdated': 'Last Checked',
      'updated': 'Updated',
      'timeAgo': 'ago',
      
      'loading': 'Loading data...',
      'error': 'Error loading data',
      'retry': 'Tap to retry',
      'pullToRefresh': 'Pull to refresh',
      
      'realtime': 'Live Updates',
      'offline': 'Offline',
      'connected': 'Connected',
      'connecting': 'Connecting...',
      
      'noData': 'No sensor data available',
      'noAlerts': 'No alerts',
      
      'smu': 'SMU',
      'celsius': '°C',
      'dbm': 'dBm',
      'percent': '%',
      'cm': 'cm',
      'meters': 'm',
      
      'aggregatedData': 'Multi-Node Data',
      'selectedNode': 'Selected Node',
      'selectionReason': 'Selection Reason',
      'totalNodes': 'Total Nodes',
      'activeNodes': 'Active Nodes',
      'blockedNodes': 'Blocked Nodes',
      'allNodes': 'All Nodes',
      'nodeDetails': 'Node Details',
      'viewAllNodes': 'View All Nodes',
      'selectionScore': 'Selection Score',
      'nodeStatus': 'Node Status',
      'active': 'Active',
      'blocked': 'Blocked',
      'lowBattery': 'Low Battery',
      'weakSignal': 'Weak Signal',
    },
    'hi': {
      'appTitle': 'खेत की नमी',
      'dashboard': 'मुख्य पेज',
      
      'node': 'सेंसर',
      'crop': 'फसल',
      
      'moisture': 'मिट्टी में पानी',
      'temperature': 'तापमान',
      'battery': 'बैटरी',
      'signal': 'सिग्नल',
      'depth': 'गहराई',
      'distance': 'दूरी',
      
      'goodCondition': 'सब ठीक है',
      'needsWater': 'पानी चाहिए',
      'tooWet': 'ज्यादा गीला',
      'unknown': 'अज्ञात',
      
      'recommendations': 'क्या करें',
      'irrigationAdvice': 'सिंचाई सलाह',
      'bestCrop': 'सबसे अच्छी फसल',
      'cropSuitability': 'फसल उपयुक्तता',
      
      'fuzzyAnalysis': 'मिट्टी विश्लेषण',
      'confidence': 'विश्वास',
      'dry': 'सूखा',
      'optimal': 'उत्तम',
      'wet': 'गीला',
      
      'lastUpdated': 'आखरी बार देखा',
      'updated': 'अपडेट हुआ',
      'timeAgo': 'पहले',
      
      'loading': 'डेटा लोड हो रहा है...',
      'error': 'डेटा लोड करने में त्रुटि',
      'retry': 'दोबारा कोशिश करें',
      'pullToRefresh': 'रिफ्रेश करने के लिए खींचें',
      
      'realtime': 'लाइव अपडेट',
      'offline': 'ऑफलाइन',
      'connected': 'जुड़ा हुआ',
      'connecting': 'जुड़ रहा है...',
      
      'noData': 'कोई डेटा नहीं',
      'noAlerts': 'कोई चेतावनी नहीं',
      
      'smu': 'SMU',
      'celsius': '°C',
      'dbm': 'dBm',
      'percent': '%',
      'cm': 'सेमी',
      'meters': 'मी',
      
      'aggregatedData': 'सभी नोड्स का डेटा',
      'selectedNode': 'चयनित नोड',
      'selectionReason': 'चयन का कारण',
      'totalNodes': 'कुल नोड्स',
      'activeNodes': 'सक्रिय नोड्स',
      'blockedNodes': 'बंद नोड्स',
      'allNodes': 'सभी नोड्स',
      'nodeDetails': 'नोड विवरण',
      'viewAllNodes': 'सभी नोड्स देखें',
      'selectionScore': 'चयन स्कोर',
      'nodeStatus': 'नोड स्थिति',
      'active': 'सक्रिय',
      'blocked': 'बंद',
      'lowBattery': 'कम बैटरी',
      'weakSignal': 'कमजोर सिग्नल',
    },
  };

  static String translate(String key, String language) {
    return translations[language]?[key] ?? 
           translations['en']?[key] ?? 
           key;
  }
}
