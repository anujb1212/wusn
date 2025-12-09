class Field {
  final int id; // Backend: 'nodeId'
  final String fieldName;
  final double latitude;
  final double longitude;
  final String soilTexture;
  final String? cropType;
  final DateTime? sowingDate;
  
  Field({
    required this.id,
    required this.fieldName,
    required this.latitude,
    required this.longitude,
    required this.soilTexture,
    this.cropType,
    this.sowingDate,
  });

  factory Field.fromJson(Map<String, dynamic> json) {
    return Field(
      id: json['nodeId'] ?? 0, 
      fieldName: json['fieldName'] ?? 'Field ${json['nodeId']}',
      latitude: (json['latitude'] ?? 0.0).toDouble(),
      longitude: (json['longitude'] ?? 0.0).toDouble(),
      soilTexture: json['soilTexture'] ?? 'LOAM',
      cropType: json['cropType'], // Nullable if not configured
      sowingDate: json['sowingDate'] != null 
          ? DateTime.parse(json['sowingDate']) 
          : null,
    );
  }
}
