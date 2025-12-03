class IrrigationDecision {
  final bool shouldIrrigate;
  final double recommendedDepthMm;
  final String reasonEn;
  final String reasonHi;
  final int nextCheckHours;
  final double confidence;
  final String ruleTriggered;
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
    this.pattern,
    this.weather,
    this.growthInfo,
  });

  factory IrrigationDecision.fromJson(Map<String, dynamic> json) {
    return IrrigationDecision(
      shouldIrrigate: json['shouldIrrigate'] ?? false,
      recommendedDepthMm: (json['recommendedDepthMm'] ?? 0.0).toDouble(),
      reasonEn: json['reason_en'] ?? '',
      reasonHi: json['reason_hi'] ?? '',
      nextCheckHours: json['nextCheckHours'] ?? 24,
      confidence: (json['confidence'] ?? 0.0).toDouble(),
      ruleTriggered: json['ruleTriggered'] ?? '',
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
