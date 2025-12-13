class Field {
  /// Backend: 'nodeId' (kept as id in app)
  final int id;

  final String fieldName;
  final double latitude;
  final double longitude;
  final String soilTexture;

  final String? cropType;
  final DateTime? sowingDate;

  /// NEW: crop-specific
  final double? baseTemperature;

  /// NEW: from crop.lateSeasonGDD
  final double? expectedGDDTotal;

  /// NEW: Backend enum
  final String? currentGrowthStage;

  Field({
    required this.id,
    required this.fieldName,
    required this.latitude,
    required this.longitude,
    required this.soilTexture,
    this.cropType,
    this.sowingDate,
    this.baseTemperature,
    this.expectedGDDTotal,
    this.currentGrowthStage,
  });

  factory Field.fromJson(Map<String, dynamic> json) {
    final id = _Json.asInt(
        json['nodeId'] ?? json['id'] ?? json['fieldId'] ?? json['field_id'],
        fallback: 0);

    final fieldName = _Json.asString(
      json['fieldName'] ?? json['field_name'],
      fallback: 'Field $id',
    );

    return Field(
      id: id,
      fieldName: fieldName,
      latitude: _Json.asDouble(json['latitude'] ?? json['lat'], fallback: 0.0),
      longitude: _Json.asDouble(json['longitude'] ?? json['lng'] ?? json['lon'],
          fallback: 0.0),
      soilTexture: _Json.asString(json['soilTexture'] ?? json['soil_texture'],
          fallback: 'LOAM'),
      cropType: _Json.asNullableString(json['cropType'] ?? json['crop_type']),
      sowingDate:
          _Json.asNullableDateTime(json['sowingDate'] ?? json['sowing_date']),
      baseTemperature: _Json.asNullableDouble(
          json['baseTemperature'] ?? json['base_temperature']),
      expectedGDDTotal: _Json.asNullableDouble(
          json['expectedGDDTotal'] ?? json['expected_gdd_total']),
      currentGrowthStage: _Json.asNullableString(
        json['currentGrowthStage'] ?? json['current_growth_stage'],
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'nodeId': id,
      'fieldName': fieldName,
      'latitude': latitude,
      'longitude': longitude,
      'soilTexture': soilTexture,
      'cropType': cropType,
      'sowingDate': sowingDate?.toIso8601String(),
      'baseTemperature': baseTemperature,
      'expectedGDDTotal': expectedGDDTotal,
      'currentGrowthStage': currentGrowthStage,
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
    if (v is String) return DateTime.tryParse(v)?.toUtc();
    if (v is int) return DateTime.fromMillisecondsSinceEpoch(v, isUtc: true);
    return null;
  }
}
