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
    final nodeId = _Json.asInt(json['nodeId'] ?? json['node_id'], fallback: 0);

    final fieldCfgMap =
        _Json.asNullableMap(json['fieldConfig'] ?? json['field_config']);
    final gddMap = _Json.asNullableMap(json['gddData'] ?? json['gdd_data']);
    final growthMap =
        _Json.asNullableMap(json['growthInfo'] ?? json['growth_info']);

    return GDDStatus(
      nodeId: nodeId,
      fieldConfig:
          fieldCfgMap == null ? null : FieldConfig.fromJson(fieldCfgMap),
      gddData: gddMap == null ? null : GDDData.fromJson(gddMap),
      growthInfo: growthMap == null ? null : GrowthInfo.fromJson(growthMap),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
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

  /// "INITIAL|DEVELOPMENT|MID_SEASON|LATE_SEASON|HARVEST_READY"
  final String? currentGrowthStage;

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
    this.currentGrowthStage,
  });

  factory FieldConfig.fromJson(Map<String, dynamic> json) {
    return FieldConfig(
      nodeId: _Json.asInt(json['nodeId'] ?? json['node_id'], fallback: 0),
      fieldName: _Json.asString(json['fieldName'] ?? json['field_name'],
          fallback: 'Field'),
      cropType: _Json.asNullableString(json['cropType'] ?? json['crop_type']),
      sowingDate:
          _Json.asNullableDateTime(json['sowingDate'] ?? json['sowing_date']),
      soilTexture: _Json.asString(json['soilTexture'] ?? json['soil_texture'],
          fallback: 'SANDY_LOAM'),
      baseTemperature: _Json.asNullableDouble(
          json['baseTemperature'] ?? json['base_temperature']),
      expectedGDDTotal: _Json.asNullableDouble(
          json['expectedGDDTotal'] ?? json['expected_gdd_total']),
      latitude: _Json.asNullableDouble(json['latitude']),
      longitude: _Json.asNullableDouble(json['longitude']),
      currentGrowthStage: _Json.asNullableString(
          json['currentGrowthStage'] ?? json['current_growth_stage']),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'nodeId': nodeId,
      'fieldName': fieldName,
      'cropType': cropType,
      'sowingDate': sowingDate?.toIso8601String(),
      'soilTexture': soilTexture,
      'baseTemperature': baseTemperature,
      'expectedGDDTotal': expectedGDDTotal,
      'latitude': latitude,
      'longitude': longitude,
      'currentGrowthStage': currentGrowthStage,
    };
  }
}

class GDDData {
  final DateTime date;
  final double dailyGDD;
  final double cumulativeGDD;

  /// Kept for UI continuity (even if backend doesn’t always provide it).
  final double avgSoilTemp;

  final String? growthStage;
  final double? totalGDDRequired;

  /// 0-100 format
  final double progressPercent;

  final int daysElapsed;
  final double? estimatedDaysToHarvest;

  GDDData({
    required this.date,
    required this.dailyGDD,
    required this.cumulativeGDD,
    required this.avgSoilTemp,
    this.growthStage,
    this.totalGDDRequired,
    required this.progressPercent,
    required this.daysElapsed,
    this.estimatedDaysToHarvest,
  });

  factory GDDData.fromJson(Map<String, dynamic> json) {
    // date can be ISO string; if missing/invalid, use "today" to avoid crashes.
    final parsedDate = _Json.asNullableDateTime(json['date'] ?? json['day']);
    final date = (parsedDate ?? DateTime.now().toUtc());

    final progressRaw = json['progressPercent'] ??
        json['progressPercentage'] ??
        json['progress_percent'];

    return GDDData(
      date: date,
      dailyGDD:
          _Json.asDouble(json['dailyGDD'] ?? json['daily_gdd'], fallback: 0.0),
      cumulativeGDD: _Json.asDouble(
          json['cumulativeGDD'] ?? json['cumulative_gdd'],
          fallback: 0.0),
      avgSoilTemp: _Json.asDouble(json['avgSoilTemp'] ?? json['avg_soil_temp'],
          fallback: 0.0),
      growthStage:
          _Json.asNullableString(json['growthStage'] ?? json['growth_stage']),
      totalGDDRequired: _Json.asNullableDouble(
          json['totalGDDRequired'] ?? json['total_gdd_required']),
      progressPercent: _Json.asDouble(progressRaw, fallback: 0.0),
      daysElapsed:
          _Json.asInt(json['daysElapsed'] ?? json['days_elapsed'], fallback: 0),
      estimatedDaysToHarvest: _Json.asNullableDouble(
        json['estimatedDaysToHarvest'] ?? json['estimated_days_to_harvest'],
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'date': date.toIso8601String(),
      'dailyGDD': dailyGDD,
      'cumulativeGDD': cumulativeGDD,
      'avgSoilTemp': avgSoilTemp,
      'growthStage': growthStage,
      'totalGDDRequired': totalGDDRequired,
      'progressPercent': progressPercent,
      'daysElapsed': daysElapsed,
      'estimatedDaysToHarvest': estimatedDaysToHarvest,
    };
  }

  String getStageColor() {
    switch (growthStage?.toUpperCase()) {
      case 'INITIAL':
        return '#2196F3';
      case 'DEVELOPMENT':
        return '#4CAF50';
      case 'MID_SEASON':
        return '#FF9800';
      case 'LATE_SEASON':
        return '#FFC107';
      case 'HARVEST_READY':
        return '#8BC34A';
      default:
        return '#9E9E9E';
    }
  }

  // Kept as-is to avoid UI behavior change.
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
        return '✨';
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

  /// Backend may send null; keep nullable-safe parsing but keep field non-null with default.
  final double estimatedDaysToHarvest;

  final String descriptionEn;
  final String descriptionHi;

  GrowthInfo({
    required this.stage,
    required this.progress,
    required this.daysElapsed,
    required this.gddAccumulated,
    required this.gddRequired,
    required this.gddRemaining,
    required this.estimatedDaysToHarvest,
    required this.descriptionEn,
    required this.descriptionHi,
  });

  factory GrowthInfo.fromJson(Map<String, dynamic> json) {
    final est = json['estimatedDaysToHarvest'] ??
        json['estimatedDaysToMaturity'] ??
        json['estimated_days'];

    return GrowthInfo(
      stage: _Json.asString(json['stage'], fallback: 'INITIAL'),
      progress: _Json.asDouble(json['progress'], fallback: 0.0),
      daysElapsed:
          _Json.asInt(json['daysElapsed'] ?? json['days_elapsed'], fallback: 0),
      gddAccumulated: _Json.asDouble(
          json['gddAccumulated'] ?? json['gdd_accumulated'],
          fallback: 0.0),
      gddRequired: _Json.asDouble(json['gddRequired'] ?? json['gdd_required'],
          fallback: 0.0),
      gddRemaining: _Json.asDouble(
          json['gddRemaining'] ?? json['gdd_remaining'],
          fallback: 0.0),
      estimatedDaysToHarvest: _Json.asDouble(est, fallback: 0.0),
      descriptionEn: _Json.asString(
          json['description_en'] ?? json['descriptionEn'],
          fallback: ''),
      descriptionHi: _Json.asString(
          json['description_hi'] ?? json['descriptionHi'],
          fallback: ''),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'stage': stage,
      'progress': progress,
      'daysElapsed': daysElapsed,
      'gddAccumulated': gddAccumulated,
      'gddRequired': gddRequired,
      'gddRemaining': gddRemaining,
      'estimatedDaysToHarvest': estimatedDaysToHarvest,
      'description_en': descriptionEn,
      'description_hi': descriptionHi,
    };
  }
}

/// Local JSON coercion helpers (private to this file).
class _Json {
  static String asString(dynamic v, {required String fallback}) {
    if (v == null) return fallback;
    if (v is String) return v;
    return v.toString();
  }

  static String? asNullableString(dynamic v) {
    if (v == null) return null;
    final s = v is String ? v : v.toString();
    final t = s.trim();
    return t.isEmpty ? null : t;
  }

  static int asInt(dynamic v, {required int fallback}) {
    if (v == null) return fallback;
    if (v is int) return v;
    if (v is num) return v.toInt();
    if (v is String) return int.tryParse(v.trim()) ?? fallback;
    return fallback;
  }

  static double asDouble(dynamic v, {required double fallback}) {
    if (v == null) return fallback;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v.trim()) ?? fallback;
    return fallback;
  }

  static double? asNullableDouble(dynamic v) {
    if (v == null) return null;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v.trim());
    return null;
  }

  static DateTime? asNullableDateTime(dynamic v) {
    if (v == null) return null;
    if (v is DateTime) return v.toUtc();
    if (v is String) {
      final parsed = DateTime.tryParse(v);
      return parsed?.toUtc();
    }
    if (v is int) {
      // epoch milliseconds
      return DateTime.fromMillisecondsSinceEpoch(v, isUtc: true);
    }
    return null;
  }

  static Map<String, dynamic>? asNullableMap(dynamic v) {
    if (v == null) return null;
    if (v is Map<String, dynamic>) return v;
    if (v is Map) return Map<String, dynamic>.from(v);
    return null;
  }
}
