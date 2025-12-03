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
  });

  factory Field.fromJson(Map<String, dynamic> json) {
    return Field(
      id: json['id'] ?? 0,
      fieldName: json['fieldName'] ?? 'Unknown Field',
      latitude: (json['latitude'] ?? 0.0).toDouble(),
      longitude: (json['longitude'] ?? 0.0).toDouble(),
      soilType: json['soilType'],
      recommendedCrop: json['recommendedCrop'],
      selectedCrop: json['selectedCrop'],
      sowingDate: json['sowingDate'] != null 
          ? DateTime.parse(json['sowingDate']) 
          : null,
      cropConfirmed: json['cropConfirmed'] ?? false,
      accumulatedGDD: (json['accumulatedGDD'] ?? 0.0).toDouble(),
      currentGrowthStage: json['currentGrowthStage'],
      lastIrrigationCheck: json['lastIrrigationCheck'] != null
          ? DateTime.parse(json['lastIrrigationCheck'])
          : null,
    );
  }
}
