class SensorData {
  final int nodeId;
  final int moisture;
  final int temperature;
  final int rssi;
  final DateTime timestamp;
  
  // Fuzzy logic results
  final String soilStatus;
  final String irrigationAdvice;
  final int confidence;
  final FuzzyScores fuzzyScores;
  
  // Crop recommendations
  final String bestCrop;
  final int cropConfidence;
  final List<CropSuitability> alternativeCrops;
  final String summary;

  SensorData({
    required this.nodeId,
    required this.moisture,
    required this.temperature,
    required this.rssi,
    required this.timestamp,
    required this.soilStatus,
    required this.irrigationAdvice,
    required this.confidence,
    required this.fuzzyScores,
    required this.bestCrop,
    required this.cropConfidence,
    required this.alternativeCrops,
    required this.summary,
  });

  factory SensorData.fromJson(Map<String, dynamic> json) {
    return SensorData(
      nodeId: json['nodeId'] ?? 0,
      moisture: json['moisture'] ?? 0,
      temperature: json['temperature'] ?? 0,
      rssi: json['rssi'] ?? -100,
      timestamp: json['timestamp'] != null 
          ? DateTime.parse(json['timestamp']) 
          : DateTime.now(),
      soilStatus: json['soilStatus'] ?? 'unknown',
      irrigationAdvice: json['irrigationAdvice'] ?? 'No data',
      confidence: json['confidence'] ?? 0,
      fuzzyScores: FuzzyScores.fromJson(json['fuzzyScores'] ?? {}),
      bestCrop: json['bestCrop'] ?? 'unknown',
      cropConfidence: json['cropConfidence'] ?? 0,
      alternativeCrops: (json['alternativeCrops'] as List<dynamic>?)
          ?.map((crop) => CropSuitability.fromJson(crop))
          .toList() ?? [],
      summary: json['summary'] ?? '',
    );
  }
  
  // Status helper (for backward compatibility)
  String get status {
    switch (soilStatus) {
      case 'needs_water':
        return 'needsWater';
      case 'too_wet':
        return 'tooWet';
      case 'optimal':
        return 'goodCondition';
      default:
        return 'unknown';
    }
  }
}

class FuzzyScores {
  final int dry;
  final int optimal;
  final int wet;

  FuzzyScores({
    required this.dry,
    required this.optimal,
    required this.wet,
  });

  factory FuzzyScores.fromJson(Map<String, dynamic> json) {
    return FuzzyScores(
      dry: json['dry'] ?? 0,
      optimal: json['optimal'] ?? 0,
      wet: json['wet'] ?? 0,
    );
  }
}

class CropSuitability {
  final String cropName;
  final int suitability;
  final String reason;

  CropSuitability({
    required this.cropName,
    required this.suitability,
    required this.reason,
  });

  factory CropSuitability.fromJson(Map<String, dynamic> json) {
    return CropSuitability(
      cropName: json['cropName'] ?? 'unknown',
      suitability: json['suitability'] ?? 0,
      reason: json['reason'] ?? '',
    );
  }
}
