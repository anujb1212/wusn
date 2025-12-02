class SensorData {
  // Aggregation flags and metadata
  final bool isAggregated;
  final int? selectedNodeId;
  final String? selectionReason;
  final double? selectionScore;
  final int? totalNodes;
  final int? activeNodes;
  final int? blockedNodes;
  final List<NodeInfo>? allNodesData;

  // Core sensor values (for selected node or single node)
  final int nodeId;
  final int moisture;
  final int temperature;
  final int rssi;
  final int? batteryLevel;
  final DateTime timestamp;

  // Fuzzy logic results
  final String soilStatus;
  final String irrigationAdvice;
  final String? irrigationAdviceHi;
  final int confidence;
  final FuzzyScores fuzzyScores;

  // Crop recommendations
  final String bestCrop;
  final String? bestCropHi;
  final int cropConfidence;
  final List<CropSuitability> alternativeCrops;
  final String summary;
  final String? summaryHi;

  SensorData({
    this.isAggregated = false,
    this.selectedNodeId,
    this.selectionReason,
    this.selectionScore,
    this.totalNodes,
    this.activeNodes,
    this.blockedNodes,
    this.allNodesData,
    required this.nodeId,
    required this.moisture,
    required this.temperature,
    required this.rssi,
    this.batteryLevel,
    required this.timestamp,
    required this.soilStatus,
    required this.irrigationAdvice,
    this.irrigationAdviceHi,
    required this.confidence,
    required this.fuzzyScores,
    required this.bestCrop,
    this.bestCropHi,
    required this.cropConfidence,
    required this.alternativeCrops,
    required this.summary,
    this.summaryHi,
  });

  factory SensorData.fromJson(Map<String, dynamic> json) {
    final bool isAggregated = json['aggregated'] ?? false;
    if (isAggregated) {
      return SensorData._fromAggregatedJson(json);
    } else {
      return SensorData._fromSingleNodeJson(json);
    }
  }

  factory SensorData._fromAggregatedJson(Map<String, dynamic> json) {
    final allNodes = (json['allNodesData'] as List<dynamic>?)
            ?.map((node) => NodeInfo.fromJson(node as Map<String, dynamic>))
            .toList() ??
        [];

    return SensorData(
      isAggregated: true,
      selectedNodeId: json['selectedNodeId'] as int?,
      selectionReason: json['selectionReason'] as String?,
      selectionScore: (json['selectionScore'] as num?)?.toDouble(),
      totalNodes: json['totalNodes'] as int?,
      activeNodes: json['activeNodes'] as int?,
      blockedNodes: json['blockedNodes'] as int?,
      allNodesData: allNodes,
      nodeId: json['selectedNodeId'] ?? 0,
      moisture: json['moisture'] ?? 0,
      temperature: json['temperature'] ?? 0,
      rssi: json['rssi'] ?? -100,
      batteryLevel: json['batteryLevel'] as int?,
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
      soilStatus: json['soilStatus'] ?? 'unknown',
      irrigationAdvice: json['irrigationAdvice'] ?? 'No data',
      irrigationAdviceHi: json['irrigationAdviceHi'] as String?,
      confidence: json['confidence'] ?? 0,
      fuzzyScores: FuzzyScores.fromJson(
          (json['fuzzyScores'] as Map<String, dynamic>? ?? {})),
      bestCrop: json['bestCrop'] ?? 'unknown',
      bestCropHi: json['bestCropHi'] as String?,
      cropConfidence: json['cropConfidence'] ?? 0,
      alternativeCrops: (json['alternativeCrops'] as List<dynamic>?)
              ?.map((crop) =>
                  CropSuitability.fromJson(crop as Map<String, dynamic>))
              .toList() ??
          [],
      summary: json['summary'] ?? '',
      summaryHi: json['summaryHi'] as String?,
    );
  }

  factory SensorData._fromSingleNodeJson(Map<String, dynamic> json) {
    return SensorData(
      isAggregated: false,
      nodeId: json['nodeId'] ?? 0,
      moisture: json['moisture'] ?? 0,
      temperature: json['temperature'] ?? 0,
      rssi: json['rssi'] ?? -100,
      batteryLevel: json['batteryLevel'] as int?,
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
      soilStatus: json['soilStatus'] ?? 'unknown',
      irrigationAdvice: json['irrigationAdvice'] ?? 'No data',
      irrigationAdviceHi: json['irrigationAdviceHi'] as String?,
      confidence: json['confidence'] ?? 0,
      fuzzyScores: FuzzyScores.fromJson(
          (json['fuzzyScores'] as Map<String, dynamic>? ?? {})),
      bestCrop: json['bestCrop'] ?? 'unknown',
      bestCropHi: json['bestCropHi'] as String?,
      cropConfidence: json['cropConfidence'] ?? 0,
      alternativeCrops: (json['alternativeCrops'] as List<dynamic>?)
              ?.map((crop) =>
                  CropSuitability.fromJson(crop as Map<String, dynamic>))
              .toList() ??
          [],
      summary: json['summary'] ?? '',
      summaryHi: json['summaryHi'] as String?,
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
}

class NodeInfo {
  final int nodeId;
  final int moisture;
  final int temperature;
  final int rssi;
  final int batteryLevel;
  final double depth;
  final double distance;

  NodeInfo({
    required this.nodeId,
    required this.moisture,
    required this.temperature,
    required this.rssi,
    required this.batteryLevel,
    required this.depth,
    required this.distance,
  });

  factory NodeInfo.fromJson(Map<String, dynamic> json) {
    return NodeInfo(
      nodeId: json['nodeId'] ?? 0,
      moisture: json['moisture'] ?? 0,
      temperature: json['temperature'] ?? 0,
      rssi: json['rssi'] ?? -100,
      batteryLevel: json['batteryLevel'] ?? 0,
      depth: (json['depth'] as num?)?.toDouble() ?? 0.0,
      distance: (json['distance'] as num?)?.toDouble() ?? 0.0,
    );
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
