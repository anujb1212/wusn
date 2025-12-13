class SensorData {
  final int nodeId;
  final String fieldName;

  /// Backend VWC%
  final double vwc;

  /// Backend soil temp
  final double soilTemp;

  /// Backend air temp
  final double? airTemp;

  final DateTime timestamp;

  /// Internal status backing field (can be snake_case/camelCase depending on source).
  /// Prefer using [status] for UI keys.
  final String soilStatus;

  final String irrigationAdvice;
  final double confidence;
  final FuzzyScores fuzzyScores;

  final String bestCrop;
  final double cropConfidence;
  final List<CropSuitability> alternativeCrops;
  final String summary;

  // Backend optimal ranges
  final double? soilTempMin;
  final double? soilTempOptimal;
  final double? soilTempMax;
  final double? vwcMin;
  final double? vwcOptimal;
  final double? vwcMax;

  SensorData({
    required this.nodeId,
    this.fieldName = 'Field',
    this.vwc = 0.0,
    this.soilTemp = 0.0,
    this.airTemp,
    required this.timestamp,
    this.soilStatus = 'unknown',
    this.irrigationAdvice = 'Analyzing...',
    this.confidence = 0.0,
    required this.fuzzyScores,
    this.bestCrop = 'Unknown',
    this.cropConfidence = 0.0,
    this.alternativeCrops = const <CropSuitability>[],
    this.summary = 'Loading data...',
    this.soilTempMin,
    this.soilTempOptimal,
    this.soilTempMax,
    this.vwcMin,
    this.vwcOptimal,
    this.vwcMax,
  });

  factory SensorData.initial(int id, String name) {
    return SensorData(
      nodeId: id,
      fieldName: name,
      timestamp: DateTime.now().toUtc(),
      vwc: 0.0,
      soilTemp: 0.0,
      fuzzyScores: const FuzzyScores(dry: 0.0, optimal: 0.0, wet: 0.0),
    );
  }

  /// Optional: tolerate mixed backend shapes if ever needed directly.
  factory SensorData.fromJson(Map<String, dynamic> json) {
    final fuzzy =
        _Json.asNullableMap(json['fuzzyScores'] ?? json['fuzzy_scores']);
    final crops = json['alternativeCrops'] ?? json['alternative_crops'];

    return SensorData(
      nodeId: _Json.asInt(json['nodeId'] ?? json['node_id'], fallback: 0),
      fieldName: _Json.asString(json['fieldName'] ?? json['field_name'],
          fallback: 'Field'),
      vwc:
          _Json.asDouble(json['vwc'] ?? json['soilMoistureVWC'], fallback: 0.0),
      soilTemp: _Json.asDouble(json['soilTemp'] ?? json['soilTemperature'],
          fallback: 0.0),
      airTemp:
          _Json.asNullableDouble(json['airTemp'] ?? json['airTemperature']),
      timestamp: _Json.asDateTime(json['timestamp'] ?? json['createdAt']) ??
          DateTime.now().toUtc(),
      soilStatus: _Json.asString(json['soilStatus'] ?? json['soil_status'],
          fallback: 'unknown'),
      irrigationAdvice: _Json.asString(
        json['irrigationAdvice'] ?? json['irrigation_advice'],
        fallback: 'Analyzing...',
      ),
      confidence: _Json.asDouble(json['confidence'], fallback: 0.0),
      fuzzyScores: fuzzy == null
          ? const FuzzyScores(dry: 0.0, optimal: 0.0, wet: 0.0)
          : FuzzyScores.fromJson(fuzzy),
      bestCrop: _Json.asString(json['bestCrop'] ?? json['best_crop'],
          fallback: 'Unknown'),
      cropConfidence: _Json.asDouble(
          json['cropConfidence'] ?? json['crop_confidence'],
          fallback: 0.0),
      alternativeCrops: _Json.asList(crops)
          .map((e) => CropSuitability.fromAny(e))
          .whereType<CropSuitability>()
          .toList(),
      summary: _Json.asString(json['summary'], fallback: 'Loading data...'),
      soilTempMin: _Json.asNullableDouble(json['soilTempMin']),
      soilTempOptimal: _Json.asNullableDouble(json['soilTempOptimal']),
      soilTempMax: _Json.asNullableDouble(json['soilTempMax']),
      vwcMin: _Json.asNullableDouble(json['vwcMin']),
      vwcOptimal: _Json.asNullableDouble(json['vwcOptimal']),
      vwcMax: _Json.asNullableDouble(json['vwcMax']),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'nodeId': nodeId,
      'fieldName': fieldName,
      'vwc': vwc,
      'soilTemp': soilTemp,
      'airTemp': airTemp,
      'timestamp': timestamp.toIso8601String(),
      'soilStatus': soilStatus,
      'irrigationAdvice': irrigationAdvice,
      'confidence': confidence,
      'fuzzyScores': fuzzyScores.toJson(),
      'bestCrop': bestCrop,
      'cropConfidence': cropConfidence,
      'alternativeCrops': alternativeCrops.map((c) => c.toJson()).toList(),
      'summary': summary,
      'soilTempMin': soilTempMin,
      'soilTempOptimal': soilTempOptimal,
      'soilTempMax': soilTempMax,
      'vwcMin': vwcMin,
      'vwcOptimal': vwcOptimal,
      'vwcMax': vwcMax,
    };
  }

  // Sentinel object to allow "explicit null" in copyWith for nullable fields.
  static const Object _unset = _Unset();

  SensorData copyWith({
    String? fieldName,
    double? vwc,
    double? soilTemp,
    Object? airTemp = _unset,
    DateTime? timestamp,
    String? soilStatus,
    String? irrigationAdvice,
    double? confidence,
    FuzzyScores? fuzzyScores,
    String? bestCrop,
    double? cropConfidence,
    List<CropSuitability>? alternativeCrops,
    String? summary,
    Object? soilTempMin = _unset,
    Object? soilTempOptimal = _unset,
    Object? soilTempMax = _unset,
    Object? vwcMin = _unset,
    Object? vwcOptimal = _unset,
    Object? vwcMax = _unset,
  }) {
    return SensorData(
      nodeId: nodeId,
      fieldName: fieldName ?? this.fieldName,
      vwc: vwc ?? this.vwc,
      soilTemp: soilTemp ?? this.soilTemp,
      airTemp: identical(airTemp, _unset) ? this.airTemp : airTemp as double?,
      timestamp: timestamp ?? this.timestamp,
      soilStatus: soilStatus ?? this.soilStatus,
      irrigationAdvice: irrigationAdvice ?? this.irrigationAdvice,
      confidence: confidence ?? this.confidence,
      fuzzyScores: fuzzyScores ?? this.fuzzyScores,
      bestCrop: bestCrop ?? this.bestCrop,
      cropConfidence: cropConfidence ?? this.cropConfidence,
      alternativeCrops: alternativeCrops ?? this.alternativeCrops,
      summary: summary ?? this.summary,
      soilTempMin: identical(soilTempMin, _unset)
          ? this.soilTempMin
          : soilTempMin as double?,
      soilTempOptimal: identical(soilTempOptimal, _unset)
          ? this.soilTempOptimal
          : soilTempOptimal as double?,
      soilTempMax: identical(soilTempMax, _unset)
          ? this.soilTempMax
          : soilTempMax as double?,
      vwcMin: identical(vwcMin, _unset) ? this.vwcMin : vwcMin as double?,
      vwcOptimal: identical(vwcOptimal, _unset)
          ? this.vwcOptimal
          : vwcOptimal as double?,
      vwcMax: identical(vwcMax, _unset) ? this.vwcMax : vwcMax as double?,
    );
  }

  double get moistureVWC => vwc;

  String _normStatus(String s) =>
      s.trim().toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');

  /// UI-facing status key used by translations and SensorCard:
  /// `needsWater`, `tooWet`, `goodCondition`, `unknown`.
  String get status {
    final s = _normStatus(soilStatus);

    switch (s) {
      // dry
      case 'needs_water':
      case 'need_water':
      case 'needswater':
      case 'needs_water_now':
      case 'dry':
        return 'needsWater';

      // wet
      case 'too_wet':
      case 'toowet':
      case 'overwatered':
      case 'wet':
        return 'tooWet';

      // optimal
      case 'optimal':
      case 'good':
      case 'good_condition':
      case 'goodcondition':
      case 'ok':
        return 'goodCondition';

      default:
        return 'unknown';
    }
  }
}

class FuzzyScores {
  final double dry;
  final double optimal;
  final double wet;

  const FuzzyScores({
    required this.dry,
    required this.optimal,
    required this.wet,
  });

  factory FuzzyScores.fromJson(Map<String, dynamic> json) {
    return FuzzyScores(
      dry: _Json.asDouble(json['dry'], fallback: 0.0),
      optimal: _Json.asDouble(json['optimal'], fallback: 0.0),
      wet: _Json.asDouble(json['wet'], fallback: 0.0),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'dry': dry,
        'optimal': optimal,
        'wet': wet,
      };
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

  static CropSuitability? fromAny(dynamic v) {
    final map = _Json.asNullableMap(v);
    if (map == null) return null;
    return CropSuitability.fromJson(map);
  }

  factory CropSuitability.fromJson(Map<String, dynamic> json) {
    return CropSuitability(
      cropName: _Json.asString(json['cropName'] ?? json['crop_name'],
          fallback: 'Unknown'),
      suitability: _Json.asDouble(
        json['totalScore'] ??
            json['score'] ??
            json['suitability'] ??
            json['suitabilityScore'],
        fallback: 0.0,
      ),
      reason:
          _Json.asString(json['explanation'] ?? json['reason'], fallback: ''),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'cropName': cropName,
        'suitability': suitability,
        'reason': reason,
      };
}

class _Unset {
  const _Unset();
}

/// Local JSON coercion helpers (private to this file).
class _Json {
  static String asString(dynamic v, {required String fallback}) {
    if (v == null) return fallback;
    if (v is String) return v;
    return v.toString();
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

  static DateTime? asDateTime(dynamic v) {
    if (v == null) return null;
    if (v is DateTime) return v.toUtc();
    if (v is String) return DateTime.tryParse(v)?.toUtc();
    if (v is int) return DateTime.fromMillisecondsSinceEpoch(v, isUtc: true);
    return null;
  }

  static Map<String, dynamic>? asNullableMap(dynamic v) {
    if (v == null) return null;
    if (v is Map<String, dynamic>) return v;
    if (v is Map) return Map<String, dynamic>.from(v);
    return null;
  }

  static List<dynamic> asList(dynamic v) => v is List ? v : const <dynamic>[];
}
