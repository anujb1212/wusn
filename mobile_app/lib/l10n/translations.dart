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

      // NEW: Phase 2 - Crop Confirmation
      'confirmCrop': 'Confirm Crop',
      'cropConfirmation': 'Crop Confirmation',
      'recommendation': 'Recommendation',
      'selectCrop': 'Select Crop',
      'soilType': 'Soil Type',
      'sowingDate': 'Sowing Date',
      'confirm': 'Confirm',
      'success': 'Success!',
      'cropConfirmed': 'Crop confirmed successfully',
      'cropConfirmedMessage': 'You can now check irrigation advice',
      'selectCropFirst': 'Please select a crop',
      'cropFirst': 'Confirm crop first, then check irrigation advice',

      // Crop names
      'wheat': 'Wheat',
      'rice': 'Rice',
      'maize': 'Maize',
      'mustard': 'Mustard',
      'chickpea': 'Chickpea',
      'cotton': 'Cotton',

      // Soil types
      'sandy': 'Sandy',
      'loam': 'Loam',
      'clayLoam': 'Clay Loam',

      // NEW: Phase 3 - Irrigation Decision
      'irrigation': 'Irrigation',
      'irrigate': 'IRRIGATE',
      'skip': 'SKIP',
      'waitForRain': 'Wait',
      'irrigateNow': 'Irrigate Now',
      'skipIrrigation': 'Skip Irrigation',
      'irrigationDecision': 'Irrigation Decision',
      'recommendedDepth': 'Recommended Depth',
      'nextCheck': 'Next Check',
      'hours': 'hours',
      'days': 'days',
      'minutes': 'minutes',

      // Growth stages
      'growthStage': 'Growth Stage',
      'growthProgress': 'Growth Progress',
      'initial': 'Initial / Germination',
      'development': 'Vegetative Development',
      'midSeason': 'Mid-Season / Flowering',
      'lateSeason': 'Late Season / Grain Filling',
      'harvestReady': 'Harvest Ready / Maturity',
      'daysElapsed': 'Days Since Sowing',
      'accumulatedGDD': 'Accumulated GDD',
      'waterDemand': 'Water Demand (Kc)',

      // Field info
      'fieldInformation': 'Field Information',
      'fieldDetails': 'Field Details',
      'sensorData': 'Sensor Data',
      'lastUpdate': 'Last Update',

      // Weather
      'weatherForecast': 'Weather Forecast',
      'rainForecast': 'Rain Forecast (3 days)',
      'avgTemperature': 'Avg Temperature (7 days)',
      'rain3Days': 'Rain (3 days)',
      'avgTemp7Days': 'Avg temp (7 days)',

      // Irrigation pattern
      'irrigationMethod': 'Irrigation Method',
      'duration': 'Duration',
      'drip': 'DRIP',
      'sprinkler': 'SPRINKLER',
      'flood': 'FLOOD',
      'skipMethod': 'SKIP',

      // Common actions
      'ok': 'OK',
      'cancel': 'Cancel',
      'close': 'Close',
      'refresh': 'Refresh',
      'viewDetails': 'View Details',
      'back': 'Back',

      'cropAlreadyConfirmed': 'Crop already confirmed',
      'cropAlreadyConfirmedHint':
          'Changing sowing date will reset GDD calculation.',
      'updateCrop': 'Update Crop',
      'why': 'Why?',
      'reloadCropList': 'Reload crop list',
      'irrigationNeeded': 'No irrigation needed',
      'urgencyScore': 'urgency score',
      'noAdvice': 'No recommendation available',
      'skipIrrigationTitle': 'SKIP IRRIGATION',
      'addAnotherNode': 'Add another node',
      'nodeLabel': 'Node',
      'burialDepth': 'Burial Depth (cm)',
      'locationOptional': 'Location (optional)',
      'continueToField': 'Continue to Field Setup',
      'creatingNode': 'Creating Node...',
      'deficitTooltip':
          'How much water your soil is missing. Difference between target and current VWC.',
      'depthTooltip': 'Water needed to fill soil deficit. 1mm = 1 litre/m².',
      'durationTooltip': 'Duration = depth ÷ application rate (mm/hour).',
    },
    'hi': {
      // Existing translations
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

      // NEW: Phase 2 - Crop Confirmation
      'confirmCrop': 'फसल पुष्टि',
      'cropConfirmation': 'फसल की पुष्टि करें',
      'recommendation': 'सिफारिश',
      'selectCrop': 'फसल चुनें',
      'soilType': 'मिट्टी का प्रकार',
      'sowingDate': 'बुवाई की तारीख',
      'confirm': 'पुष्टि करें',
      'success': 'सफलता!',
      'cropConfirmed': 'फसल की पुष्टि सफल रही',
      'cropConfirmedMessage': 'अब आप सिंचाई सलाह देख सकते हैं',
      'selectCropFirst': 'कृपया फसल चुनें',
      'cropFirst': 'पहले फसल की पुष्टि करें, फिर सिंचाई सलाह देखें',

      // Crop names
      'wheat': 'गेहूं',
      'rice': 'चावल',
      'maize': 'मक्का',
      'mustard': 'सरसों',
      'chickpea': 'चना',
      'cotton': 'कपास',

      // Soil types
      'sandy': 'रेतीली',
      'loam': 'दोमट',
      'clayLoam': 'चिकनी दोमट',

      // NEW: Phase 3 - Irrigation Decision
      'irrigation': 'सिंचाई सलाह',
      'irrigate': 'सिंचाई करें',
      'skip': 'प्रतीक्षा करें',
      'waitForRain': 'प्रतीक्षा',
      'irrigateNow': 'अभी सिंचाई करें',
      'skipIrrigation': 'सिंचाई टालें',
      'irrigationDecision': 'सिंचाई निर्णय',
      'recommendedDepth': 'सुझाई गई गहराई',
      'nextCheck': 'अगली जांच',
      'hours': 'घंटे',
      'days': 'दिन',
      'minutes': 'मिनट',

      // Growth stages
      'growthStage': 'वृद्धि चरण',
      'growthProgress': 'वृद्धि की प्रगति',
      'initial': 'प्रारंभिक / अंकुरण',
      'development': 'वानस्पतिक विकास',
      'midSeason': 'मध्य-मौसम / फूल आना',
      'lateSeason': 'देर से मौसम / अनाज भरना',
      'harvestReady': 'कटाई के लिए तैयार',
      'daysElapsed': 'बुवाई के बाद दिन',
      'accumulatedGDD': 'संचित GDD',
      'waterDemand': 'पानी की मांग (Kc)',

      // Field info
      'fieldInformation': 'खेत की जानकारी',
      'fieldDetails': 'खेत विवरण',
      'sensorData': 'सेंसर डेटा',
      'lastUpdate': 'अंतिम अपडेट',

      // Weather
      'weatherForecast': 'मौसम पूर्वानुमान',
      'rainForecast': 'बारिश का अनुमान (3 दिन)',
      'avgTemperature': 'औसत तापमान (7 दिन)',
      'rain3Days': '3 दिन में बारिश',
      'avgTemp7Days': 'औसत तापमान (7 दिन)',

      // Irrigation pattern
      'irrigationMethod': 'सिंचाई विधि',
      'duration': 'अवधि',
      'drip': 'ड्रिप',
      'sprinkler': 'फव्वारा',
      'flood': 'बाढ़',
      'skipMethod': 'प्रतीक्षा करें',

      // Common actions
      'ok': 'ठीक है',
      'cancel': 'रद्द करें',
      'close': 'बंद करें',
      'refresh': 'रिफ्रेश करें',
      'viewDetails': 'विवरण देखें',
      'back': 'वापस',

      'cropAlreadyConfirmed': 'फसल पहले से पुष्टि हो चुकी है',
      'cropAlreadyConfirmedHint': 'बुवाई की तारीख बदलने से GDD रीसेट हो जाएगा।',
      'updateCrop': 'अपडेट करें',
      'why': 'क्यों?',
      'reloadCropList': 'फसल सूची फिर से लोड करें',
      'irrigationNeeded': 'सिंचाई की आवश्यकता नहीं',
      'urgencyScore': 'तात्कालिकता स्कोर',
      'noAdvice': 'कोई सुझाव उपलब्ध नहीं है',
      'skipIrrigationTitle': 'सिंचाई न करें',
      'addAnotherNode': 'और नोड जोड़ें',
      'nodeLabel': 'नोड',
      'burialDepth': 'दफन गहराई (सेमी)',
      'locationOptional': 'स्थान (वैकल्पिक)',
      'continueToField': 'खेत सेटअप जारी रखें',
      'creatingNode': 'नोड बना रहे हैं...',
      'deficitTooltip': 'आपकी मिट्टी में कितना पानी कम है।',
      'depthTooltip':
          'मिट्टी की कमी पूरी करने के लिए कितना पानी डालें। 1mm = 1 लीटर/m².',
      'durationTooltip': 'सिंचाई का समय = गहराई ÷ लागू दर (mm/घंटा)।',
    },
  };

  static String translate(String key, String language) {
    final k = key.trim();
    if (k.isEmpty) return '';

    final langMap = translations[language];
    final enMap = translations['en'];

    return langMap?[k] ?? enMap?[k] ?? k;
  }
}
