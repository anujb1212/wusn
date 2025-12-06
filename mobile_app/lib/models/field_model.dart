
class Field {
  final int id;
  final String fieldName;
  final double latitude;
  final double longitude;
  final String? soilType;
  final String? recommendedCrop;
  final String? selectedCrop;
  final DateTime? sowingDate;
  final bool cropConfirmed;
  final double accumulatedGDD;
  final String? currentGrowthStage;
  final DateTime? lastIrrigationCheck;
  final double? baseTemperature;
  final double? expectedGDDTotal;

  Field({
    required this.id,
    required this.fieldName,
    required this.latitude,
    required this.longitude,
    this.soilType,
    this.recommendedCrop,
    this.selectedCrop,
    this.sowingDate,
    required this.cropConfirmed,
    required this.accumulatedGDD,
    this.currentGrowthStage,
    this.lastIrrigationCheck,
    this.baseTemperature,
    this.expectedGDDTotal,
  });

  factory Field.fromJson(Map<String, dynamic> json) {
    return Field(
      id: json['id'] ?? json['nodeId'] ?? 0,
      fieldName: json['fieldName'] ?? 'Unknown Field',
      latitude: (json['latitude'] ?? 0.0).toDouble(),
      longitude: (json['longitude'] ?? 0.0).toDouble(),
      soilType: json['soilType'] ?? json['soilTexture'],
      recommendedCrop: json['recommendedCrop'],
      selectedCrop: json['selectedCrop'] ?? json['cropType'],
      sowingDate: json['sowingDate'] != null
          ? DateTime.parse(json['sowingDate'])
          : null,
      cropConfirmed: json['cropConfirmed'] ?? false,
      accumulatedGDD: (json['accumulatedGDD'] ?? 0.0).toDouble(),
      currentGrowthStage: json['currentGrowthStage'],
      lastIrrigationCheck: json['lastIrrigationCheck'] != null
          ? DateTime.parse(json['lastIrrigationCheck'])
          : null,
      baseTemperature: json['baseTemperature'] != null
          ? (json['baseTemperature'] as num).toDouble()
          : null,
      expectedGDDTotal: json['expectedGDDTotal'] != null
          ? (json['expectedGDDTotal'] as num).toDouble()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fieldName': fieldName,
      'latitude': latitude,
      'longitude': longitude,
      'soilType': soilType,
      'recommendedCrop': recommendedCrop,
      'selectedCrop': selectedCrop,
      'sowingDate': sowingDate?.toIso8601String(),
      'cropConfirmed': cropConfirmed,
      'accumulatedGDD': accumulatedGDD,
      'currentGrowthStage': currentGrowthStage,
      'lastIrrigationCheck': lastIrrigationCheck?.toIso8601String(),
      'baseTemperature': baseTemperature,
      'expectedGDDTotal': expectedGDDTotal,
    };
  }

  /// Calculate GDD progress percentage
  double getGDDProgress() {
    if (expectedGDDTotal == null || expectedGDDTotal! <= 0) return 0.0;
    return (accumulatedGDD / expectedGDDTotal!) * 100;
  }

  /// Get days since sowing
  int? getDaysSinceSowing() {
    if (sowingDate == null) return null;
    return DateTime.now().difference(sowingDate!).inDays;
  }
}
