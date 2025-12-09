class SensorData {
  final int nodeId;
  final String fieldName;
  final int moisture;
  final double temperature;
  final int rssi;
  final int? batteryLevel;
  final DateTime timestamp;
  final String soilStatus;
  final String irrigationAdvice;
  final double confidence;
  final FuzzyScores fuzzyScores;
  final String bestCrop;
  final double cropConfidence;
  final List<CropSuitability> alternativeCrops;
  final String summary;
  final bool isAggregated;
  final int? selectedNodeId;
  final String? selectionReason;
  final double? selectionScore;
  final int? totalNodes;
  final int? activeNodes;
  final int? blockedNodes;
  final List<dynamic>? allNodesData;

  SensorData({
    required this.nodeId,
    this.fieldName = 'Field',
    this.moisture = 0,
    this.temperature = 0.0,
    this.rssi = -100,
    this.batteryLevel,
    required this.timestamp,
    this.soilStatus = 'unknown',
    this.irrigationAdvice = 'Analyzing...',
    this.confidence = 0.0,
    required this.fuzzyScores,
    this.bestCrop = 'Unknown',
    this.cropConfidence = 0.0,
    this.alternativeCrops = const [],
    this.summary = 'Loading data...',
    this.isAggregated = false,
    this.selectedNodeId,
    this.selectionReason,
    this.selectionScore,
    this.totalNodes = 1,
    this.activeNodes = 1,
    this.blockedNodes = 0,
    this.allNodesData,
  });

  factory SensorData.initial(int id, String name) {
    return SensorData(
      nodeId: id,
      fieldName: name,
      timestamp: DateTime.now(),
      fuzzyScores: FuzzyScores(dry: 0, optimal: 0, wet: 0),
    );
  }

  SensorData copyWith({
    int? moisture,
    double? temperature,
    int? rssi,
    DateTime? timestamp,
    String? soilStatus,
    String? irrigationAdvice,
    double? confidence,
    FuzzyScores? fuzzyScores, // ✅ ADDED
    String? bestCrop,
    double? cropConfidence,
    List<CropSuitability>? alternativeCrops,
    String? summary,
  }) {
    return SensorData(
      nodeId: this.nodeId,
      fieldName: this.fieldName,
      moisture: moisture ?? this.moisture,
      temperature: temperature ?? this.temperature,
      rssi: rssi ?? this.rssi,
      batteryLevel: this.batteryLevel,
      timestamp: timestamp ?? this.timestamp,
      soilStatus: soilStatus ?? this.soilStatus,
      irrigationAdvice: irrigationAdvice ?? this.irrigationAdvice,
      confidence: confidence ?? this.confidence,
      fuzzyScores: fuzzyScores ?? this.fuzzyScores, // ✅ ADDED
      bestCrop: bestCrop ?? this.bestCrop,
      cropConfidence: cropConfidence ?? this.cropConfidence,
      alternativeCrops: alternativeCrops ?? this.alternativeCrops,
      summary: summary ?? this.summary,
      isAggregated: this.isAggregated,
      totalNodes: this.totalNodes,
      activeNodes: this.activeNodes,
      allNodesData: this.allNodesData,
    );
  }

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

  double get moistureVWC => moisture.toDouble();
}

class FuzzyScores {
  final double dry;
  final double optimal;
  final double wet;
  FuzzyScores({required this.dry, required this.optimal, required this.wet});
}

class CropSuitability {
  final String cropName;
  final double suitability;
  final String reason;

  CropSuitability(
      {required this.cropName,
      required this.suitability,
      required this.reason});

  factory CropSuitability.fromJson(Map<String, dynamic> json) {
    return CropSuitability(
      cropName: json['cropName'] ?? 'Unknown',
      suitability:
          (json['totalScore'] ?? json['score'] ?? json['suitability'] ?? 0)
              .toDouble(),
      reason: json['explanation'] ?? json['reason'] ?? '',
    );
  }
}
