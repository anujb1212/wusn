class Field {
  final int id;
  final int nodeId;
  final String fieldName;
  final double latitude;
  final double longitude;
  final String soilTexture;

  final int? nodesCount;
  final DateTime? lastIrrigationCheck;

  final String? cropType;
  final DateTime? sowingDate;

  final double? baseTemperature;

  final double? expectedGDDTotal;

  final String? currentGrowthStage;

  final DateTime? createdAt;

  Field({
    required this.id,
    required this.nodeId,
    required this.fieldName,
    required this.latitude,
    required this.longitude,
    required this.soilTexture,
    this.cropType,
    this.sowingDate,
    this.baseTemperature,
    this.expectedGDDTotal,
    this.currentGrowthStage,
    this.createdAt,
    this.nodesCount,
    this.lastIrrigationCheck,
  });

  factory Field.fromJson(Map<String, dynamic> json) {
    final id = _Json.asInt(json['id'] ?? json['fieldId'] ?? json['field_id'],
        fallback: 0);
    final nodeId = _Json.asInt(json['nodeId'], fallback: 0) != 0
        ? _Json.asInt(json['nodeId'], fallback: 0)
        : _Json.asInt(json['id'], fallback: 0);

    final fieldName = _Json.asString(
      json['fieldName'] ?? json['field_name'],
      fallback: 'Field $id',
    );

    return Field(
      id: id,
      nodeId: nodeId,
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
      createdAt:
          _Json.asNullableDateTime(json['createdAt'] ?? json['created_at']),
      nodesCount: _Json.asInt(
        json['nodesCount'] ??
            json['nodes_count'] ??
            (json['nodes'] is List ? (json['nodes'] as List).length : 0),
        fallback: 0,
      ),
      lastIrrigationCheck: _Json.asNullableDateTime(
        json['lastIrrigationCheck'] ?? json['last_irrigation_check'],
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
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}

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
