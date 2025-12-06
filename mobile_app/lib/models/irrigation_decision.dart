
class IrrigationDecision {
  final bool shouldIrrigate;
  final double recommendedDepthMm;
  final String reasonEn;
  final String reasonHi;
  final int nextCheckHours;
  final double confidence;
  final String ruleTriggered;
  final double currentVWC;
  final double targetVWC;
  final String urgency; // LOW, MEDIUM, HIGH, CRITICAL
  final double estimatedWaterNeeded; // mm
  final String? recommendedMethod; // drip, sprinkler, flood
  final int? durationMinutes;
  final String? weatherConsideration;
  final IrrigationPattern? pattern;
  final WeatherForecast? weather;
  final GrowthStageInfo? growthInfo;

  IrrigationDecision({
    required this.shouldIrrigate,
    required this.recommendedDepthMm,
    required this.reasonEn,
    required this.reasonHi,
    required this.nextCheckHours,
    required this.confidence,
    required this.ruleTriggered,
    this.currentVWC = 0.0,
    this.targetVWC = 0.0,
    this.urgency = 'LOW',
    this.estimatedWaterNeeded = 0.0,
    this.recommendedMethod,
    this.durationMinutes,
    this.weatherConsideration,
    this.pattern,
    this.weather,
    this.growthInfo,
  });

  factory IrrigationDecision.fromJson(Map<String, dynamic> json) {
    return IrrigationDecision(
      shouldIrrigate: json['shouldIrrigate'] ?? false,
      recommendedDepthMm: (json['recommendedDepthMm'] ?? json['estimatedWaterNeeded'] ?? 0.0).toDouble(),
      reasonEn: json['reason_en'] ?? json['reason'] ?? '',
      reasonHi: json['reason_hi'] ?? '',
      nextCheckHours: json['nextCheckHours'] ?? 24,
      confidence: (json['confidence'] ?? 0.0).toDouble(),
      ruleTriggered: json['ruleTriggered'] ?? '',
      currentVWC: (json['currentVWC'] ?? 0.0).toDouble(),
      targetVWC: (json['targetVWC'] ?? 0.0).toDouble(),
      urgency: json['urgency'] ?? 'LOW',
      estimatedWaterNeeded: (json['estimatedWaterNeeded'] ?? 0.0).toDouble(),
      recommendedMethod: json['recommendedMethod'],
      durationMinutes: json['durationMinutes'],
      weatherConsideration: json['weatherConsideration'],
      pattern: json['irrigationPattern'] != null
          ? IrrigationPattern.fromJson(json['irrigationPattern'])
          : null,
      weather: json['weatherForecast'] != null
          ? WeatherForecast.fromJson(json['weatherForecast'])
          : null,
      growthInfo: json['growthStageInfo'] != null
          ? GrowthStageInfo.fromJson(json['growthStageInfo'])
          : null,
    );
  }
  
  /// Get urgency color for UI
  String getUrgencyColor() {
    switch (urgency) {
      case 'CRITICAL':
        return '#D32F2F'; // Red
      case 'HIGH':
        return '#F57C00'; // Orange
      case 'MEDIUM':
        return '#FBC02D'; // Yellow
      case 'LOW':
      default:
        return '#388E3C'; // Green
    }
  }

  /// Get urgency icon for UI
  String getUrgencyIcon() {
    switch (urgency) {
      case 'CRITICAL':
        return '🚨';
      case 'HIGH':
        return '⚠️';
      case 'MEDIUM':
        return '⚡';
      case 'LOW':
      default:
        return '✅';
    }
  }
}

class IrrigationPattern {
  final String type;
  final int? durationMinutes;
  final String notes;

  IrrigationPattern({
    required this.type,
    this.durationMinutes,
    required this.notes,
  });

  factory IrrigationPattern.fromJson(Map<String, dynamic> json) {
    return IrrigationPattern(
      type: json['type'] ?? 'skip',
      durationMinutes: json['duration_minutes'],
      notes: json['notes'] ?? '',
    );
  }
}

class WeatherForecast {
  final double next3DaysRainMm;
  final double avgTempNext7Days;

  WeatherForecast({
    required this.next3DaysRainMm,
    required this.avgTempNext7Days,
  });

  factory WeatherForecast.fromJson(Map<String, dynamic> json) {
    return WeatherForecast(
      next3DaysRainMm: (json['next3DaysRainMm'] ?? 0.0).toDouble(),
      avgTempNext7Days: (json['avgTempNext7Days'] ?? 0.0).toDouble(),
    );
  }
}

class GrowthStageInfo {
  final String stage;
  final double progress;
  final double kc;

  GrowthStageInfo({
    required this.stage,
    required this.progress,
    required this.kc,
  });

  factory GrowthStageInfo.fromJson(Map<String, dynamic> json) {
    return GrowthStageInfo(
      stage: json['stage'] ?? 'INITIAL',
      progress: (json['progress'] ?? 0.0).toDouble(),
      kc: (json['Kc'] ?? 0.0).toDouble(),
    );
  }
}
