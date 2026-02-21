class CropRecommendation {
  /// Backend primary response
  final List<CropSuitabilityDetail> topCrops;

  /// {currentVWC, currentSoilTemp, currentAirTemp, ...}
  final Map<String, dynamic> conditions;

  final String? bestCrop;
  final String? bestCropHindi;
  final int? confidence;
  final String? summary;
  final List<String>? validUPCrops;

  CropRecommendation({
    required this.topCrops,
    required this.conditions,
    this.bestCrop,
    this.bestCropHindi,
    this.confidence,
    this.summary,
    this.validUPCrops,
  });

  factory CropRecommendation.fromJson(Map<String, dynamic> json) {
    final dynamic rawTop =
        json['topCrops'] ?? json['top_crops'] ?? json['recommendations'];
    final List<dynamic> topList = rawTop is List ? rawTop : const <dynamic>[];

    final dynamic rawConditions = json['conditions'] ??
        json['currentConditions'] ??
        json['current_conditions'];
    final Map<String, dynamic> conditionsMap = _Json.asMap(rawConditions);

    final dynamic rawValid =
        json['validUPCrops'] ?? json['valid_up_crops'] ?? json['validCrops'];
    final List<String> validList = _Json.asStringList(rawValid);

    final String? bestCrop =
        _Json.asNullableString(json['bestCrop'] ?? json['best_crop']);
    final String? bestCropHindi = _Json.asNullableString(
        json['bestCropHindi'] ?? json['best_crop_hindi']);

    final int? confidence = _Json.asNullableInt(json['confidence']);
    final String? summary = _Json.asNullableString(json['summary']);

    return CropRecommendation(
      topCrops: topList
          .map((crop) => CropSuitabilityDetail.fromAny(crop))
          .whereType<CropSuitabilityDetail>()
          .toList(),
      conditions: conditionsMap,
      bestCrop: bestCrop,
      bestCropHindi: bestCropHindi,
      confidence: confidence,
      summary: summary,
      validUPCrops: validList.isEmpty ? null : validList,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'topCrops': topCrops.map((crop) => crop.toJson()).toList(),
      'conditions': conditions,
      'bestCrop': bestCrop,
      'bestCropHindi': bestCropHindi,
      'confidence': confidence,
      'summary': summary,
      'validUPCrops': validUPCrops,
    };
  }
}

class CropSuitabilityDetail {
  final String cropName;

  /// Backend scoring
  final int totalScore;

  /// Backend ranking
  final int rank;

  /// 0-100
  final int suitability;

  final String reason;

  final double? moistureMatch;
  final bool? soilMatch;
  final double? seasonMatch;

  CropSuitabilityDetail({
    required this.cropName,
    required this.totalScore,
    required this.rank,
    required this.suitability,
    required this.reason,
    this.moistureMatch,
    this.soilMatch,
    this.seasonMatch,
  });

  /// Accepts dynamic to avoid crashes when list entries are not typed as Map<String,dynamic>.
  static CropSuitabilityDetail? fromAny(dynamic value) {
    final map = _Json.asNullableMap(value);
    if (map == null) return null;
    return CropSuitabilityDetail.fromJson(map);
  }

  factory CropSuitabilityDetail.fromJson(Map<String, dynamic> json) {
    // Support aliases and guard against missing/incorrect types.
    final cropName = _Json.asString(
      json['cropName'] ?? json['crop_name'] ?? json['name'],
      fallback: 'unknown',
    );

    final totalScore =
        _Json.asInt(json['totalScore'] ?? json['total_score'], fallback: 0);
    final rank = _Json.asInt(json['rank'], fallback: 0);

    final suitability = _Json.asInt(
      json['suitability'] ??
          json['suitabilityScore'] ??
          json['suitability_score'],
      fallback: 0,
    );

    final reason = _Json.asString(json['reason'] ?? json['why'], fallback: '');

    final moistureMatch =
        _Json.asNullableDouble(json['moistureMatch'] ?? json['moisture_match']);
    final soilMatch =
        _Json.asNullableBool(json['soilMatch'] ?? json['soil_match']);
    final seasonMatch =
        _Json.asNullableDouble(json['seasonMatch'] ?? json['season_match']);

    return CropSuitabilityDetail(
      cropName: cropName,
      totalScore: totalScore,
      rank: rank,
      suitability: suitability,
      reason: reason,
      moistureMatch: moistureMatch,
      soilMatch: soilMatch,
      seasonMatch: seasonMatch,
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'cropName': cropName,
      'totalScore': totalScore,
      'rank': rank,
      'suitability': suitability,
      'reason': reason,
      'moistureMatch': moistureMatch,
      'soilMatch': soilMatch,
      'seasonMatch': seasonMatch,
    };
  }

  String getSuitabilityColor() {
    if (totalScore >= 80 || suitability >= 80) return '#4CAF50';
    if (totalScore >= 60 || suitability >= 60) return '#8BC34A';
    if (totalScore >= 40 || suitability >= 40) return '#FFC107';
    if (totalScore >= 20 || suitability >= 20) return '#FF9800';
    return '#F44336';
  }

  String getSuitabilityLabel() {
    if (totalScore >= 80 || suitability >= 80) return 'Excellent';
    if (totalScore >= 60 || suitability >= 60) return 'Good';
    if (totalScore >= 40 || suitability >= 40) return 'Moderate';
    if (totalScore >= 20 || suitability >= 20) return 'Poor';
    return 'Not Recommended';
  }

  // Kept as-is to avoid UI behavior change.
  String getSuitabilityIcon() {
    if (totalScore >= 80 || suitability >= 80) return '🌟';
    if (totalScore >= 60 || suitability >= 60) return '✅';
    if (totalScore >= 40 || suitability >= 40) return '⚠️';
    if (totalScore >= 20 || suitability >= 20) return '⚡';
    return '❌';
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

  static int? asNullableInt(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    if (v is num) return v.toInt();
    if (v is String) return int.tryParse(v.trim());
    return null;
  }

  static double? asNullableDouble(dynamic v) {
    if (v == null) return null;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v.trim());
    return null;
  }

  static bool? asNullableBool(dynamic v) {
    if (v == null) return null;
    if (v is bool) return v;
    if (v is String) {
      final t = v.trim().toLowerCase();
      if (t == 'true' || t == '1' || t == 'yes') return true;
      if (t == 'false' || t == '0' || t == 'no') return false;
    }
    if (v is num) return v != 0;
    return null;
  }

  static Map<String, dynamic> asMap(dynamic v) {
    if (v == null) return <String, dynamic>{};
    if (v is Map<String, dynamic>) return v;
    if (v is Map) return Map<String, dynamic>.from(v);
    return <String, dynamic>{};
  }

  static Map<String, dynamic>? asNullableMap(dynamic v) {
    if (v == null) return null;
    if (v is Map<String, dynamic>) return v;
    if (v is Map) return Map<String, dynamic>.from(v);
    return null;
  }

  static List<String> asStringList(dynamic v) {
    if (v == null) return <String>[];
    if (v is List) {
      return v
          .map((e) => e == null ? null : e.toString().trim())
          .whereType<String>()
          .where((s) => s.isNotEmpty)
          .toList();
    }
    return <String>[];
  }
}
