// lib/models/gdd_status.dart

class GDDStatus {
  final int nodeId;
  final FieldConfig? fieldConfig;
  final GDDData? gddData;
  final GrowthInfo? growthInfo;

  GDDStatus({
    required this.nodeId,
    this.fieldConfig,
    this.gddData,
    this.growthInfo,
  });

  factory GDDStatus.fromJson(Map<String, dynamic> json) {
    return GDDStatus(
      nodeId: json['nodeId'] as int,
      fieldConfig: json['fieldConfig'] != null
          ? FieldConfig.fromJson(json['fieldConfig'])
          : null,
      gddData: json['gddData'] != null
          ? GDDData.fromJson(json['gddData'])
          : null,
      growthInfo: json['growthInfo'] != null
          ? GrowthInfo.fromJson(json['growthInfo'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'nodeId': nodeId,
      'fieldConfig': fieldConfig?.toJson(),
      'gddData': gddData?.toJson(),
      'growthInfo': growthInfo?.toJson(),
    };
  }
}

class FieldConfig {
  final int nodeId;
  final String fieldName;
  final String? cropType;
  final DateTime? sowingDate;
  final String soilTexture;
  final double? baseTemperature;
  final double? expectedGDDTotal;
  final double? latitude;
  final double? longitude;

  FieldConfig({
    required this.nodeId,
    required this.fieldName,
    this.cropType,
    this.sowingDate,
    required this.soilTexture,
    this.baseTemperature,
    this.expectedGDDTotal,
    this.latitude,
    this.longitude,
  });

  factory FieldConfig.fromJson(Map<String, dynamic> json) {
    return FieldConfig(
      nodeId: json['nodeId'] as int,
      fieldName: json['fieldName'] as String,
      cropType: json['cropType'] as String?,
      sowingDate: json['sowingDate'] != null
          ? DateTime.parse(json['sowingDate'])
          : null,
      soilTexture: json['soilTexture'] as String? ?? 'SANDY_LOAM',
      baseTemperature: json['baseTemperature'] != null
          ? (json['baseTemperature'] as num).toDouble()
          : null,
      expectedGDDTotal: json['expectedGDDTotal'] != null
          ? (json['expectedGDDTotal'] as num).toDouble()
          : null,
      latitude: json['latitude'] != null
          ? (json['latitude'] as num).toDouble()
          : null,
      longitude: json['longitude'] != null
          ? (json['longitude'] as num).toDouble()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'nodeId': nodeId,
      'fieldName': fieldName,
      'cropType': cropType,
      'sowingDate': sowingDate?.toIso8601String(),
      'soilTexture': soilTexture,
      'baseTemperature': baseTemperature,
      'expectedGDDTotal': expectedGDDTotal,
      'latitude': latitude,
      'longitude': longitude,
    };
  }
}

class GDDData {
  final DateTime date;
  final double dailyGDD;
  final double cumulativeGDD;
  final double avgSoilTemp;
  final String? growthStage;
  final double? totalGDDRequired;
  final double progressPercentage;
  final int daysElapsed;

  GDDData({
    required this.date,
    required this.dailyGDD,
    required this.cumulativeGDD,
    required this.avgSoilTemp,
    this.growthStage,
    this.totalGDDRequired,
    required this.progressPercentage,
    required this.daysElapsed,
  });

  factory GDDData.fromJson(Map<String, dynamic> json) {
    return GDDData(
      date: DateTime.parse(json['date']),
      dailyGDD: (json['dailyGDD'] as num).toDouble(),
      cumulativeGDD: (json['cumulativeGDD'] as num).toDouble(),
      avgSoilTemp: (json['avgSoilTemp'] as num).toDouble(),
      growthStage: json['growthStage'] as String?,
      totalGDDRequired: json['totalGDDRequired'] != null
          ? (json['totalGDDRequired'] as num).toDouble()
          : null,
      progressPercentage: (json['progressPercentage'] as num).toDouble(),
      daysElapsed: json['daysElapsed'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'date': date.toIso8601String(),
      'dailyGDD': dailyGDD,
      'cumulativeGDD': cumulativeGDD,
      'avgSoilTemp': avgSoilTemp,
      'growthStage': growthStage,
      'totalGDDRequired': totalGDDRequired,
      'progressPercentage': progressPercentage,
      'daysElapsed': daysElapsed,
    };
  }

  /// Get growth stage color for UI
  String getStageColor() {
    switch (growthStage?.toUpperCase()) {
      case 'INITIAL':
        return '#2196F3'; // Blue
      case 'DEVELOPMENT':
        return '#4CAF50'; // Green
      case 'MID_SEASON':
        return '#FF9800'; // Orange
      case 'LATE_SEASON':
        return '#FFC107'; // Amber
      case 'HARVEST_READY':
        return '#8BC34A'; // Light Green
      default:
        return '#9E9E9E'; // Grey
    }
  }

  /// Get growth stage icon
  String getStageIcon() {
    switch (growthStage?.toUpperCase()) {
      case 'INITIAL':
        return '🌱';
      case 'DEVELOPMENT':
        return '🌿';
      case 'MID_SEASON':
        return '🌾';
      case 'LATE_SEASON':
        return '🌾';
      case 'HARVEST_READY':
        return '🌾';
      default:
        return '📊';
    }
  }
}

class GrowthInfo {
  final String stage;
  final double progress;
  final int daysElapsed;
  final double gddAccumulated;
  final double gddRequired;
  final double gddRemaining;
  final int estimatedDaysToMaturity;
  final String descriptionEn;
  final String descriptionHi;

  GrowthInfo({
    required this.stage,
    required this.progress,
    required this.daysElapsed,
    required this.gddAccumulated,
    required this.gddRequired,
    required this.gddRemaining,
    required this.estimatedDaysToMaturity,
    required this.descriptionEn,
    required this.descriptionHi,
  });

  factory GrowthInfo.fromJson(Map<String, dynamic> json) {
    return GrowthInfo(
      stage: json['stage'] as String,
      progress: (json['progress'] as num).toDouble(),
      daysElapsed: json['daysElapsed'] as int,
      gddAccumulated: (json['gddAccumulated'] as num).toDouble(),
      gddRequired: (json['gddRequired'] as num).toDouble(),
      gddRemaining: (json['gddRemaining'] as num).toDouble(),
      estimatedDaysToMaturity: json['estimatedDaysToMaturity'] as int,
      descriptionEn: json['description_en'] as String,
      descriptionHi: json['description_hi'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'stage': stage,
      'progress': progress,
      'daysElapsed': daysElapsed,
      'gddAccumulated': gddAccumulated,
      'gddRequired': gddRequired,
      'gddRemaining': gddRemaining,
      'estimatedDaysToMaturity': estimatedDaysToMaturity,
      'description_en': descriptionEn,
      'description_hi': descriptionHi,
    };
  }
}
