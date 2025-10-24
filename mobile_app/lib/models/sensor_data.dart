class SensorData {
  final int id;
  final int moisture;
  final int temperature;
  final String cropType;
  final DateTime timestamp;
  final String recommendation;

  SensorData({
    required this.id,
    required this.moisture,
    required this.temperature,
    required this.cropType,
    required this.timestamp,
    required this.recommendation,
  });

  factory SensorData.fromJson(Map<String, dynamic> json) {
    return SensorData(
      id: json['nodeId'] ?? json['id'],
      moisture: json['moisture'] ?? 0,
      temperature: json['temperature'] ?? 0,
      cropType: json['cropType'] ?? 'unknown',
      timestamp: DateTime.parse(json['timestamp']),
      recommendation: json['recommendation'] ?? '',
    );
  }

  String get status {
    if (moisture < 500) return 'needsWater';
    if (moisture > 700) return 'tooWet';
    return 'goodCondition';
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'moisture': moisture,
      'temperature': temperature,
      'cropType': cropType,
      'timestamp': timestamp.toIso8601String(),
      'recommendation': recommendation,
    };
  }
}
