// lib/models/sensor_data.dart (COMPLETE UPDATED VERSION)

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
  final double temperature;  // CHANGED: int → double
  final int rssi;
  final int? batteryLevel;
  final DateTime timestamp;

  // Fuzzy logic results
  final String soilStatus;
  final String irrigationAdvice;
  final String? irrigationAdviceHi;
  final double confidence;  // CHANGED: int → double
  final FuzzyScores fuzzyScores;

  // Crop recommendations
  final String bestCrop;
  final String? bestCropHi;
  final double cropConfidence;  // CHANGED: int → double
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

  // Type conversion helpers
  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }

  static double _toDouble(dynamic value) {
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

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
      selectedNodeId: _toInt(json['selectedNodeId']),
      selectionReason: json['selectionReason'] as String?,
      selectionScore: _toDouble(json['selectionScore']),
      totalNodes: _toInt(json['totalNodes']),
      activeNodes: _toInt(json['activeNodes']),
      blockedNodes: _toInt(json['blockedNodes']),
      allNodesData: allNodes,
      nodeId: _toInt(json['selectedNodeId'] ?? 0),
      moisture: _toInt(json['moisture']),
      temperature: _toDouble(json['temperature']),  // Safe conversion
      rssi: _toInt(json['rssi'] ?? -100),
      batteryLevel: json['batteryLevel'] != null ? _toInt(json['batteryLevel']) : null,
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
      soilStatus: json['soilStatus'] ?? 'unknown',
      irrigationAdvice: json['irrigationAdvice'] ?? 'No data',
      irrigationAdviceHi: json['irrigationAdviceHi'] as String?,
      confidence: _toDouble(json['confidence']),
      fuzzyScores: FuzzyScores.fromJson(
          (json['fuzzyScores'] as Map<String, dynamic>? ?? {})),
      bestCrop: json['bestCrop'] ?? 'unknown',
      bestCropHi: json['bestCropHi'] as String?,
      cropConfidence: _toDouble(json['cropConfidence']),
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
      nodeId: _toInt(json['nodeId']),
      moisture: _toInt(json['moisture']),
      temperature: _toDouble(json['temperature']),  // Safe conversion
      rssi: _toInt(json['rssi'] ?? -100),
      batteryLevel: json['batteryLevel'] != null ? _toInt(json['batteryLevel']) : null,
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
      soilStatus: json['soilStatus'] ?? 'unknown',
      irrigationAdvice: json['irrigationAdvice'] ?? 'No data',
      irrigationAdviceHi: json['irrigationAdviceHi'] as String?,
      confidence: _toDouble(json['confidence']),
      fuzzyScores: FuzzyScores.fromJson(
          (json['fuzzyScores'] as Map<String, dynamic>? ?? {})),
      bestCrop: json['bestCrop'] ?? 'unknown',
      bestCropHi: json['bestCropHi'] as String?,
      cropConfidence: _toDouble(json['cropConfidence']),
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
      case 'needsWater':
        return 'needsWater';
      case 'too_wet':
      case 'tooWet':
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
  final double temperature;  
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
      nodeId: SensorData._toInt(json['nodeId']),
      moisture: SensorData._toInt(json['moisture']),
      temperature: SensorData._toDouble(json['temperature']),  
      rssi: SensorData._toInt(json['rssi'] ?? -100),
      batteryLevel: SensorData._toInt(json['batteryLevel']),
      depth: SensorData._toDouble(json['depth']),
      distance: SensorData._toDouble(json['distance']),
    );
  }
}

class FuzzyScores {
  final double dry;     
  final double optimal; 
  final double wet;     

  FuzzyScores({
    required this.dry,
    required this.optimal,
    required this.wet,
  });

  factory FuzzyScores.fromJson(Map<String, dynamic> json) {
    return FuzzyScores(
      dry: SensorData._toDouble(json['dry']),
      optimal: SensorData._toDouble(json['optimal']),
      wet: SensorData._toDouble(json['wet']),
    );
  }
}

class CropSuitability {
  final String cropName;
  final double suitability;  
  final String reason;

  CropSuitability({
    required this.cropName,
    required this.suitability,
    required this.reason,
  });

  factory CropSuitability.fromJson(Map<String, dynamic> json) {
    return CropSuitability(
      cropName: json['cropName'] ?? 'unknown',
      suitability: SensorData._toDouble(json['suitability']),  
      reason: json['reason'] ?? '',
    );
  }
}
