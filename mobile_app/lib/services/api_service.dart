import 'dart:async';
import 'dart:convert';
import 'dart:developer';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import '../models/crop_recommendation.dart';
import '../models/field_model.dart';
import '../models/gdd_status.dart';
import '../models/irrigation_decision.dart';
import '../models/sensor_data.dart';

/// Robust HTTP client wrapper for the mobile app.
///
/// IMPORTANT:
/// - AppConfig.backendUrl already includes `/api` (e.g. http://host:3000/api),
///   so endpoints passed here must NOT start with `/api`.
class ApiService {
  static const Map<String, String> _headers = <String, String>{
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  static void _debugLog(
    String message, {
    Object? error,
    StackTrace? stackTrace,
  }) {
    // assert() is stripped in release mode -> prevents noisy production logs.
    assert(() {
      log(message, name: 'ApiService', error: error, stackTrace: stackTrace);
      return true;
    }());
  }

  static Uri _buildUri(
    String endpoint, {
    Map<String, String>? queryParameters,
  }) {
    final base =
        AppConfig.backendUrl; // normalized in AppConfig (no trailing slash)
    final ep = endpoint.trim();
    final normalizedEndpoint = ep.startsWith('/') ? ep : '/$ep';

    final uri = Uri.parse('$base$normalizedEndpoint');
    if (queryParameters == null || queryParameters.isEmpty) return uri;
    return uri.replace(queryParameters: queryParameters);
  }

  static dynamic _decodeJsonOrNull(String body) {
    final trimmed = body.trim();
    if (trimmed.isEmpty) return null;
    return jsonDecode(trimmed);
  }

  static dynamic _unwrapDataEnvelope(dynamic decoded) {
    // Accept either:
    // - raw JSON payload
    // - { "data": ... } envelope
    if (decoded is Map<String, dynamic> && decoded.containsKey('data')) {
      return decoded['data'];
    }
    return decoded;
  }

  static Map<String, dynamic> _expectMap(
    dynamic value, {
    required String method,
    required Uri uri,
    required String contextMessage,
  }) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) return Map<String, dynamic>.from(value);
    throw ApiException(
      message: contextMessage,
      method: method,
      uri: uri,
      decodedBody: value,
    );
  }

  static Map<String, dynamic>? _asMapOrNull(dynamic value) {
    if (value == null) return null;
    if (value is Map<String, dynamic>) return value;
    if (value is Map) return Map<String, dynamic>.from(value);
    return null;
  }

  static double _asDouble(dynamic v, {double fallback = 0.0}) {
    if (v == null) return fallback;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v.trim()) ?? fallback;
    return fallback;
  }

  static DateTime _asDateTime(dynamic v, {DateTime? fallback}) {
    final fb = (fallback ?? DateTime.now().toUtc()).toUtc();
    if (v == null) return fb;
    if (v is DateTime) return v.toUtc();
    if (v is String) {
      final parsed = DateTime.tryParse(v);
      return (parsed ?? fb).toUtc();
    }
    if (v is int) {
      // Common: epoch milliseconds
      return DateTime.fromMillisecondsSinceEpoch(v, isUtc: true);
    }
    return fb;
  }

  static Future<dynamic> _getJson(
    String endpoint, {
    Map<String, String>? queryParameters,
  }) async {
    final uri = _buildUri(endpoint, queryParameters: queryParameters);

    try {
      final response =
          await http.get(uri, headers: _headers).timeout(AppConfig.httpTimeout);
      final decoded = _decodeJsonOrNull(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        if (decoded == null) {
          throw ApiException(
            message: 'Empty JSON response',
            method: 'GET',
            uri: uri,
            statusCode: response.statusCode,
            responseBody: response.body,
          );
        }
        return _unwrapDataEnvelope(decoded);
      }

      throw ApiException(
        message: 'HTTP error',
        method: 'GET',
        uri: uri,
        statusCode: response.statusCode,
        responseBody: response.body,
        decodedBody: decoded,
      );
    } on TimeoutException catch (e, st) {
      _debugLog('GET timeout: $uri', error: e, stackTrace: st);
      throw ApiException(message: 'Request timed out', method: 'GET', uri: uri);
    } catch (e, st) {
      _debugLog('GET failed: $uri', error: e, stackTrace: st);
      if (e is ApiException) rethrow;
      throw ApiException(
          message: 'Request failed: $e', method: 'GET', uri: uri);
    }
  }

  static Future<dynamic> _postJson(
    String endpoint, {
    required Map<String, dynamic> body,
    Map<String, String>? queryParameters,
  }) async {
    final uri = _buildUri(endpoint, queryParameters: queryParameters);

    try {
      final response = await http
          .post(uri, headers: _headers, body: jsonEncode(body))
          .timeout(AppConfig.httpTimeout);

      final decoded = _decodeJsonOrNull(response.body);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        if (decoded == null) {
          throw ApiException(
            message: 'Empty JSON response',
            method: 'POST',
            uri: uri,
            statusCode: response.statusCode,
            responseBody: response.body,
          );
        }
        return _unwrapDataEnvelope(decoded);
      }

      throw ApiException(
        message: 'HTTP error',
        method: 'POST',
        uri: uri,
        statusCode: response.statusCode,
        responseBody: response.body,
        decodedBody: decoded,
      );
    } on TimeoutException catch (e, st) {
      _debugLog('POST timeout: $uri', error: e, stackTrace: st);
      throw ApiException(
          message: 'Request timed out', method: 'POST', uri: uri);
    } catch (e, st) {
      _debugLog('POST failed: $uri', error: e, stackTrace: st);
      if (e is ApiException) rethrow;
      throw ApiException(
          message: 'Request failed: $e', method: 'POST', uri: uri);
    }
  }

  static String _normalizeCropId(String value) {
    return value.trim().toLowerCase().replaceAll(RegExp(r'[\s-]+'), '_');
  }

  // -----------------------------
  // Public API methods
  // -----------------------------

  // FIELDS
  static Future<List<Field>> getFields() async {
    final uri = _buildUri('/fields');
    final res = await _getJson('/fields');

    if (res is List) {
      return res
          .map(_asMapOrNull)
          .whereType<Map<String, dynamic>>()
          .map(Field.fromJson)
          .toList();
    }

    if (res is Map<String, dynamic>) {
      final maybe = res['fields'];
      if (maybe is List) {
        return maybe
            .map(_asMapOrNull)
            .whereType<Map<String, dynamic>>()
            .map(Field.fromJson)
            .toList();
      }
    }

    _debugLog('Unexpected getFields shape from $uri: ${res.runtimeType}');
    return <Field>[];
  }

  static Future<Field> createField(Map<String, dynamic> fieldData) async {
    final uri = _buildUri('/fields');
    final res = await _postJson('/fields', body: fieldData);
    final map = _expectMap(
      res,
      method: 'POST',
      uri: uri,
      contextMessage:
          'Invalid createField response shape (expected JSON object)',
    );
    return Field.fromJson(map);
  }

  // SENSORS (supports ?hours=24)
  static Future<SensorData> getLatestSensorData(
    int nodeId, {
    int hours = 24,
  }) async {
    final qp = <String, String>{};
    if (hours > 0) qp['hours'] = hours.toString();

    final uri = _buildUri('/sensors/$nodeId/latest', queryParameters: qp);
    final res = await _getJson('/sensors/$nodeId/latest', queryParameters: qp);

    final map = _expectMap(
      res,
      method: 'GET',
      uri: uri,
      contextMessage:
          'Invalid latest sensor response shape (expected JSON object)',
    );

    // Support multiple backend key variants (robust parsing).
    final vwc = _asDouble(map['soilMoistureVWC'] ?? map['vwc'], fallback: 0.0);
    final soilTemp =
        _asDouble(map['soilTemp'] ?? map['soilTemperature'], fallback: 0.0);

    final airTempRaw = map['airTemp'] ?? map['airTemperature'];
    final double? airTemp =
        airTempRaw == null ? null : _asDouble(airTempRaw, fallback: 0.0);

    final ts = _asDateTime(
      map['timestamp'] ?? map['createdAt'],
      fallback: DateTime.now().toUtc(),
    );

    final fuzzy = map['fuzzyScores'];
    final fuzzyMap = (fuzzy is Map<String, dynamic>)
        ? fuzzy
        : (fuzzy is Map
            ? Map<String, dynamic>.from(fuzzy)
            : <String, dynamic>{});

    return SensorData(
      nodeId: (map['nodeId'] is int) ? (map['nodeId'] as int) : nodeId,
      fieldName: (map['fieldName'] is String &&
              (map['fieldName'] as String).trim().isNotEmpty)
          ? (map['fieldName'] as String)
          : 'Field $nodeId',
      vwc: vwc,
      soilTemp: soilTemp,
      airTemp: airTemp,
      timestamp: ts,
      fuzzyScores: FuzzyScores(
        dry: _asDouble(fuzzyMap['dry'], fallback: 0.0),
        optimal: _asDouble(fuzzyMap['optimal'], fallback: 0.0),
        wet: _asDouble(fuzzyMap['wet'], fallback: 0.0),
      ),
      soilTempMin: (map['soilTempMin'] == null)
          ? null
          : _asDouble(map['soilTempMin'], fallback: 0.0),
      soilTempOptimal: (map['soilTempOptimal'] == null)
          ? null
          : _asDouble(map['soilTempOptimal'], fallback: 0.0),
      soilTempMax: (map['soilTempMax'] == null)
          ? null
          : _asDouble(map['soilTempMax'], fallback: 0.0),
      vwcMin: (map['vwcMin'] == null)
          ? null
          : _asDouble(map['vwcMin'], fallback: 0.0),
      vwcOptimal: (map['vwcOptimal'] == null)
          ? null
          : _asDouble(map['vwcOptimal'], fallback: 0.0),
      vwcMax: (map['vwcMax'] == null)
          ? null
          : _asDouble(map['vwcMax'], fallback: 0.0),
    );
  }

  // GDD STATUS (supports ?date=YYYY-MM-DD)
  static Future<GDDStatus> getGDDStatus(int nodeId, {String? date}) async {
    final qp = <String, String>{};
    if (date != null && date.trim().isNotEmpty) qp['date'] = date.trim();

    final uri = _buildUri('/gdd/$nodeId/status', queryParameters: qp);
    final res = await _getJson('/gdd/$nodeId/status', queryParameters: qp);

    final map = _expectMap(
      res,
      method: 'GET',
      uri: uri,
      contextMessage:
          'Invalid GDD status response shape (expected JSON object)',
    );
    return GDDStatus.fromJson(map);
  }

  // IRRIGATION DECISION (supports ?minUrgency=HIGH&includeNone=false)
  static Future<IrrigationDecision> getIrrigationDecision(
    int nodeId, {
    String minUrgency = 'NONE',
    bool includeNone = true,
  }) async {
    final qp = <String, String>{};
    if (minUrgency.trim().isNotEmpty && minUrgency != 'NONE') {
      qp['minUrgency'] = minUrgency;
    }
    if (!includeNone) {
      qp['includeNone'] = 'false';
    }

    final uri = _buildUri('/irrigation/decision/$nodeId', queryParameters: qp);
    final res =
        await _getJson('/irrigation/decision/$nodeId', queryParameters: qp);

    final map = _expectMap(
      res,
      method: 'GET',
      uri: uri,
      contextMessage:
          'Invalid irrigation decision response shape (expected JSON object)',
    );
    return IrrigationDecision.fromJson(map);
  }

  static Future<List<IrrigationDecision>> getIrrigationRecommendations() async {
    final uri = _buildUri('/irrigation/recommendations');
    final res = await _getJson('/irrigation/recommendations');

    if (res is List) {
      return res
          .map(_asMapOrNull)
          .whereType<Map<String, dynamic>>()
          .map(IrrigationDecision.fromJson)
          .toList();
    }

    _debugLog(
        'Unexpected irrigation recommendations shape from $uri: ${res.runtimeType}');
    return <IrrigationDecision>[];
  }

  // CROP CATALOG (mobile dropdown)
  static Future<List<CropCatalogItem>> getCropCatalog() async {
    final uri = _buildUri('/crops');
    final res = await _getJson('/crops');

    if (res is List) {
      final items = res
          .map(_asMapOrNull)
          .whereType<Map<String, dynamic>>()
          .map(CropCatalogItem.fromJson)
          .toList();

      // Defensive: sort by label for stable dropdown UX
      items.sort(
          (a, b) => a.labelEn.toLowerCase().compareTo(b.labelEn.toLowerCase()));
      return items;
    }

    _debugLog('Unexpected crop catalog shape from $uri: ${res.runtimeType}');
    return <CropCatalogItem>[];
  }

  // CROP RECOMMENDATIONS
  static Future<CropRecommendation> getCropRecommendations(int nodeId) async {
    final uri = _buildUri('/crops/recommend/$nodeId');
    final res = await _getJson('/crops/recommend/$nodeId');

    final map = _expectMap(
      res,
      method: 'GET',
      uri: uri,
      contextMessage:
          'Invalid crop recommendation response shape (expected JSON object)',
    );
    return CropRecommendation.fromJson(map);
  }

  // FIELD/CROP MANAGEMENT
  static Future<Field> createNode(Map<String, dynamic> nodeData) async {
    // NOTE: This endpoint likely returns a Node, but the app currently models it as Field.
    // Keeping return type for backward compatibility; validates shape.
    final uri = _buildUri('/nodes');
    final res = await _postJson('/nodes', body: nodeData);

    final map = _expectMap(
      res,
      method: 'POST',
      uri: uri,
      contextMessage:
          'Invalid createNode response shape (expected JSON object)',
    );

    return Field.fromJson(map);
  }

  static Future<Field> confirmCrop({
    required int nodeId,
    required String cropName,
    required DateTime sowingDate,
  }) async {
    // Keep UTC ISO for backend consistency.
    final formattedDate = sowingDate.toUtc().toIso8601String();

    final body = <String, dynamic>{
      'cropType': _normalizeCropId(cropName),
      'sowingDate': formattedDate,
    };

    final uri = _buildUri('/fields/$nodeId/crop');
    final res = await _postJson('/fields/$nodeId/crop', body: body);

    final map = _expectMap(
      res,
      method: 'POST',
      uri: uri,
      contextMessage:
          'Invalid confirmCrop response shape (expected JSON object)',
    );
    return Field.fromJson(map);
  }

  // Backward Compatibility (weather may be unavailable)
  static Future<Map<String, dynamic>> getWeatherForecast(int nodeId) async {
    final uri = _buildUri('/weather/$nodeId/forecast');
    try {
      final res = await _getJson('/weather/$nodeId/forecast');
      if (res is Map<String, dynamic>) return res;
      if (res is Map) return Map<String, dynamic>.from(res);
      return <String, dynamic>{};
    } catch (e, st) {
      _debugLog(
        'Weather forecast unavailable for nodeId=$nodeId ($uri)',
        error: e,
        stackTrace: st,
      );
      return <String, dynamic>{};
    }
  }

  // Placeholder: keep signature stable
  static Future<List<dynamic>> fetchLatestData() async => <dynamic>[];
}

class CropCatalogItem {
  final String value; // canonical id: "radish", "musk_melon", etc.
  final String labelEn;
  final String? season;

  const CropCatalogItem({
    required this.value,
    required this.labelEn,
    required this.season,
  });

  factory CropCatalogItem.fromJson(Map<String, dynamic> json) {
    final value = (json['value'] ?? '').toString().trim();
    final labelEn =
        (json['labelEn'] ?? json['label'] ?? value).toString().trim();
    final season = json['season']?.toString();

    return CropCatalogItem(
      value: value,
      labelEn: labelEn.isEmpty ? value : labelEn,
      season: season,
    );
  }
}

class ApiException implements Exception {
  final String message;
  final String method;
  final Uri uri;
  final int? statusCode;
  final String? responseBody;
  final Object? decodedBody;

  ApiException({
    required this.message,
    required this.method,
    required this.uri,
    this.statusCode,
    this.responseBody,
    this.decodedBody,
  });

  @override
  String toString() {
    final sc = statusCode == null ? '' : ' statusCode=$statusCode';
    return 'ApiException($method $uri$sc): $message';
  }
}
