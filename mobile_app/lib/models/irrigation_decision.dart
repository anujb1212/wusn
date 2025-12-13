class IrrigationDecision {
  /// "irrigate_now" | "irrigate_soon" | "do_not_irrigate"
  final String decision;

  /// "NONE|LOW|MODERATE|HIGH|CRITICAL"
  final String urgency;

  /// 0-100
  final double urgencyScore;

  /// mm
  final double suggestedDepthMm;

  /// minutes
  final int suggestedDurationMin;

  /// Backend currently sends a single "reason" (English).
  /// These fields keep a bilingual-friendly shape for the app.
  final String reasonEn;
  final String reasonHi;

  final int nextCheckHours;
  final double confidence;
  final String ruleTriggered;

  final double currentVWC;
  final double targetVWC;

  /// Optional explicit percent deficit relative to target VWC
  /// (e.g. 25.0 means 25% below target).
  final double? deficitPctOfTarget;

  /// Optional assumed application rate used to convert depth -> duration (mm/hour).
  final double? applicationRateMmPerHour;

  /// Source of application rate assumption ("default" | "field_config" | "unknown").
  final String? applicationRateSource;

  /// Optional short explanation of how urgencyScore was assigned.
  final String? scoreBasis;

  final String? recommendedMethod;
  final String? weatherConsideration;

  final IrrigationPattern? pattern;
  final WeatherForecast? weather;
  final GrowthStageInfo? growthInfo;

  IrrigationDecision({
    required this.decision,
    required this.urgency,
    required this.urgencyScore,
    required this.suggestedDepthMm,
    required this.suggestedDurationMin,
    required this.reasonEn,
    required this.reasonHi,
    required this.nextCheckHours,
    required this.confidence,
    required this.ruleTriggered,
    required this.currentVWC,
    required this.targetVWC,
    this.deficitPctOfTarget,
    this.applicationRateMmPerHour,
    this.applicationRateSource,
    this.scoreBasis,
    this.recommendedMethod,
    this.weatherConsideration,
    this.pattern,
    this.weather,
    this.growthInfo,
  });

  factory IrrigationDecision.fromJson(Map<String, dynamic> json) {
    // Support both snake_case and camelCase keys to stay backward-compatible.
    final decision =
        _Json.asString(json['decision'], fallback: 'do_not_irrigate');
    final urgency = _Json.asString(json['urgency'], fallback: 'NONE');

    // Numbers may arrive as int/double/string; coerce safely.
    final urgencyScore = _Json.asDouble(json['urgencyScore'], fallback: 0.0);

    final suggestedDepthMm = _Json.asDouble(
      json['suggestedDepthMm'] ??
          json['recommendedDepthMm'] ??
          json['depthMm'] ??
          json['depth_mm'],
      fallback: 0.0,
    );

    final suggestedDurationMin = _Json.asInt(
      json['suggestedDurationMin'] ??
          json['durationMinutes'] ??
          json['duration_minutes'],
      fallback: 0,
    );

    final reasonEn = _Json.asString(
      json['reason_en'] ?? json['reasonEn'] ?? json['reason'],
      fallback: '',
    );
    // Backend does not currently send Hindi text; keep empty unless provided.
    final reasonHi = _Json.asString(
      json['reason_hi'] ?? json['reasonHi'],
      fallback: '',
    );

    final nextCheckHours = _Json.asInt(
      json['nextCheckHours'] ?? json['next_check_hours'],
      fallback: 24,
    );
    final confidence = _Json.asDouble(json['confidence'], fallback: 0.0);
    final ruleTriggered = _Json.asString(
      json['ruleTriggered'] ?? json['rule_triggered'],
      fallback: '',
    );

    final currentVWC = _Json.asDouble(
      json['currentVWC'] ??
          json['currentVwc'] ??
          json['current_vwc'] ??
          json['vwc'],
      fallback: 0.0,
    );

    final targetVWC = _Json.asDouble(
      json['targetVWC'] ?? json['targetVwc'] ?? json['target_vwc'],
      fallback: 0.0,
    );

    final deficitPctOfTarget = _Json.asDouble(
      json['deficitPctOfTarget'] ?? json['deficit_pct_of_target'],
      fallback: double.nan,
    );
    final normalizedDeficitPct =
        deficitPctOfTarget.isNaN ? null : deficitPctOfTarget;

    final applicationRateMmPerHour = _Json.asDouble(
      json['applicationRateMmPerHour'] ?? json['application_rate_mm_per_hour'],
      fallback: double.nan,
    );
    final normalizedRate =
        applicationRateMmPerHour.isNaN ? null : applicationRateMmPerHour;

    final applicationRateSource = _Json.asNullableString(
      json['applicationRateSource'] ?? json['application_rate_source'],
    );

    final scoreBasis = _Json.asNullableString(
      json['scoreBasis'] ?? json['score_basis'],
    );

    final recommendedMethod = _Json.asNullableString(
      json['recommendedMethod'] ?? json['recommended_method'],
    );
    final weatherConsideration = _Json.asNullableString(
      json['weatherConsideration'] ?? json['weather_consideration'],
    );

    // Nested objects may decode as Map<dynamic,dynamic>; normalize using Map<String,dynamic>.from.
    final patternMap = _Json.asNullableMap(
      json['irrigationPattern'] ??
          json['pattern'] ??
          json['irrigation_pattern'],
    );
    final weatherMap = _Json.asNullableMap(
      json['weatherForecast'] ?? json['weather'] ?? json['weather_forecast'],
    );
    final growthMap = _Json.asNullableMap(
      json['growthStageInfo'] ??
          json['growthInfo'] ??
          json['growth_stage_info'],
    );

    return IrrigationDecision(
      decision: decision,
      urgency: urgency,
      urgencyScore: urgencyScore,
      suggestedDepthMm: suggestedDepthMm,
      suggestedDurationMin: suggestedDurationMin,
      reasonEn: reasonEn,
      reasonHi: reasonHi,
      nextCheckHours: nextCheckHours,
      confidence: confidence,
      ruleTriggered: ruleTriggered,
      currentVWC: currentVWC,
      targetVWC: targetVWC,
      deficitPctOfTarget: normalizedDeficitPct,
      applicationRateMmPerHour: normalizedRate,
      applicationRateSource: applicationRateSource,
      scoreBasis: scoreBasis,
      recommendedMethod: recommendedMethod,
      weatherConsideration: weatherConsideration,
      pattern:
          patternMap == null ? null : IrrigationPattern.fromJson(patternMap),
      weather: weatherMap == null ? null : WeatherForecast.fromJson(weatherMap),
      growthInfo:
          growthMap == null ? null : GrowthStageInfo.fromJson(growthMap),
    );
  }

  bool get shouldIrrigate =>
      decision == 'irrigate_now' || decision == 'irrigate_soon';

  /// Whether there is an actual irrigation recommendation (non-zero depth & duration).
  bool get hasIrrigationRun =>
      shouldIrrigate && suggestedDepthMm > 0 && suggestedDurationMin > 0;

  /// Human-facing label for the decision key.
  String decisionLabel({required bool isHindi}) {
    if (isHindi) {
      switch (decision) {
        case 'irrigate_now':
          return 'अभी सिंचाई करें';
        case 'irrigate_soon':
          return 'जल्द सिंचाई करें';
        case 'do_not_irrigate':
        default:
          return 'अभी सिंचाई न करें';
      }
    } else {
      switch (decision) {
        case 'irrigate_now':
          return 'Irrigate now';
        case 'irrigate_soon':
          return 'Irrigate soon';
        case 'do_not_irrigate':
        default:
          return 'Do not irrigate now';
      }
    }
  }

  String getUrgencyColor() {
    switch (urgency) {
      case 'CRITICAL':
        return '#D32F2F';
      case 'HIGH':
        return '#F57C00';
      case 'MODERATE':
        return '#FBC02D';
      case 'LOW':
      case 'NONE':
        return '#388E3C';
      default:
        return '#9E9E9E';
    }
  }

  // Kept as-is to avoid UI behavior change.
  String getUrgencyIcon() {
    switch (urgency) {
      case 'CRITICAL':
        return '🚨';
      case 'HIGH':
        return '⚠️';
      case 'MODERATE':
        return '⚡';
      case 'LOW':
      case 'NONE':
        return '✅';
      default:
        return 'ℹ️';
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
      type: _Json.asString(json['type'], fallback: 'skip'),
      durationMinutes: _Json.asNullableInt(
        json['durationMinutes'] ??
            json['duration_minutes'] ??
            json['suggestedDurationMin'],
      ),
      notes: _Json.asString(json['notes'], fallback: ''),
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
      next3DaysRainMm: _Json.asDouble(
        json['next3DaysRainMm'] ??
            json['next_3_days_rain_mm'] ??
            json['rainNext3DaysMm'],
        fallback: 0.0,
      ),
      avgTempNext7Days: _Json.asDouble(
        json['avgTempNext7Days'] ??
            json['avg_temp_next_7_days'] ??
            json['avgTemp7d'],
        fallback: 0.0,
      ),
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
      stage: _Json.asString(json['stage'], fallback: 'INITIAL'),
      progress: _Json.asDouble(json['progress'], fallback: 0.0),
      // Backend likely uses 'kc' (not 'Kc'); support both.
      kc: _Json.asDouble(json['kc'] ?? json['Kc'], fallback: 0.0),
    );
  }
}

/// Small, local JSON coercion helpers (kept private to this file).
class _Json {
  static String asString(dynamic v, {required String fallback}) {
    if (v == null) return fallback;
    if (v is String) return v;
    return v.toString();
  }

  static String? asNullableString(dynamic v) {
    if (v == null) return null;
    final s = v is String ? v : v.toString();
    final trimmed = s.trim();
    return trimmed.isEmpty ? null : trimmed;
  }

  static int asInt(dynamic v, {required int fallback}) {
    if (v == null) return fallback;
    if (v is int) return v;
    if (v is num) return v.toInt();
    if (v is String) return int.tryParse(v.trim()) ?? fallback;
    return fallback;
  }

  static int? asNullableInt(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    if (v is num) return v.toInt();
    if (v is String) return int.tryParse(v.trim());
    return null;
  }

  static double asDouble(dynamic v, {required double fallback}) {
    if (v == null) return fallback;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v.trim()) ?? fallback;
    return fallback;
  }

  static Map<String, dynamic>? asNullableMap(dynamic v) {
    if (v == null) return null;
    if (v is Map<String, dynamic>) return v;
    if (v is Map) return Map<String, dynamic>.from(v);
    return null;
  }
}
