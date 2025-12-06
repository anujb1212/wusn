// lib/models/crop_recommendation.dart

class CropRecommendation {
  final String bestCrop;
  final String? bestCropHindi;
  final int confidence;
  final String summary;
  final List<CropSuitabilityDetail> topCrops;
  final List<String> validUPCrops;

  CropRecommendation({
    required this.bestCrop,
    this.bestCropHindi,
    required this.confidence,
    required this.summary,
    required this.topCrops,
    required this.validUPCrops,
  });

  factory CropRecommendation.fromJson(Map<String, dynamic> json) {
    final allCrops = json['topCrops'] as List<dynamic>? ?? [];

    return CropRecommendation(
      bestCrop: json['bestCrop'] as String,
      bestCropHindi: json['bestCropHindi'] as String?,
      confidence: json['confidence'] as int,
      summary: json['summary'] as String,
      topCrops: allCrops
          .map((crop) => CropSuitabilityDetail.fromJson(crop))
          .toList(),
      validUPCrops: List<String>.from(json['validUPCrops'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'bestCrop': bestCrop,
      'bestCropHindi': bestCropHindi,
      'confidence': confidence,
      'summary': summary,
      'topCrops': topCrops.map((crop) => crop.toJson()).toList(),
      'validUPCrops': validUPCrops,
    };
  }
}

class CropSuitabilityDetail {
  final String cropName;
  final int suitability; // 0-100
  final String reason;
  final double? moistureMatch;
  final bool? soilMatch;
  final double? seasonMatch;

  CropSuitabilityDetail({
    required this.cropName,
    required this.suitability,
    required this.reason,
    this.moistureMatch,
    this.soilMatch,
    this.seasonMatch,
  });

  factory CropSuitabilityDetail.fromJson(Map<String, dynamic> json) {
    return CropSuitabilityDetail(
      cropName: json['cropName'] as String,
      suitability: json['suitability'] as int,
      reason: json['reason'] as String,
      moistureMatch: json['moistureMatch'] != null
          ? (json['moistureMatch'] as num).toDouble()
          : null,
      soilMatch: json['soilMatch'] as bool?,
      seasonMatch: json['seasonMatch'] != null
          ? (json['seasonMatch'] as num).toDouble()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'cropName': cropName,
      'suitability': suitability,
      'reason': reason,
      'moistureMatch': moistureMatch,
      'soilMatch': soilMatch,
      'seasonMatch': seasonMatch,
    };
  }

  /// Get suitability color for UI (hex)
  String getSuitabilityColor() {
    if (suitability >= 80) return '#4CAF50'; // Green
    if (suitability >= 60) return '#8BC34A'; // Light Green
    if (suitability >= 40) return '#FFC107'; // Amber
    if (suitability >= 20) return '#FF9800'; // Orange
    return '#F44336'; // Red
  }

  /// Get suitability label
  String getSuitabilityLabel() {
    if (suitability >= 80) return 'Excellent';
    if (suitability >= 60) return 'Good';
    if (suitability >= 40) return 'Moderate';
    if (suitability >= 20) return 'Poor';
    return 'Not Recommended';
  }

  /// Get suitability icon
  String getSuitabilityIcon() {
    if (suitability >= 80) return '🌟';
    if (suitability >= 60) return '✅';
    if (suitability >= 40) return '⚠️';
    if (suitability >= 20) return '⚡';
    return '❌';
  }
}
