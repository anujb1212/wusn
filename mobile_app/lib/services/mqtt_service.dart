import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:mqtt_client/mqtt_client.dart';
import 'package:mqtt_client/mqtt_server_client.dart';

import '../config/app_config.dart';

class MqttService {
  late final MqttServerClient client;

  /// callback accepts (nodeId, payload)
  /// payload is normalized to { vwc, soilTemp, airTemp?, nodeId, timestamp? }
  final void Function(int, Map<String, dynamic>) onMessageReceived;

  /// notify provider of connection status
  final void Function(bool) onStatusChange;

  bool _isConnected = false;
  bool _connectInFlight = false;

  StreamSubscription<List<MqttReceivedMessage<MqttMessage>>>? _updatesSub;

  static const String _topic = 'wusn/sensor/+/data';

  MqttService({
    required this.onMessageReceived,
    required this.onStatusChange,
  });

  bool get isConnected => _isConnected;

  void _log(String msg) {
    // Avoid noisy logs in release.
    if (kDebugMode) debugPrint(msg);
  }

  Future<bool> connect() async {
    // Idempotent connect: if already connected or connecting, do nothing.
    if (_connectInFlight) return _isConnected;
    if (_isConnected &&
        client.connectionStatus?.state == MqttConnectionState.connected) {
      return true;
    }

    _connectInFlight = true;

    final host = AppConfig.mqttBroker;
    final port = AppConfig.mqttPort;

    client = MqttServerClient(
      host,
      'flutter_app_${DateTime.now().millisecondsSinceEpoch}',
    );

    client.port = port;
    client.keepAlivePeriod = 60;
    client.logging(on: false);

    // Let mqtt_client handle reconnects.
    client.autoReconnect = true;

    // With autoReconnect=true, mqtt_client uses auto-reconnect callbacks rather than onDisconnected.
    client.onConnected = _onConnected;
    client.onDisconnected = _onDisconnected;
    client.onAutoReconnect = _onAutoReconnect;
    client.onAutoReconnected = _onAutoReconnected;

    // IMPORTANT:
    // Do NOT set `onFailedConnectionAttempt` here because:
    // - Its typedef signature may not match a zero-arg function.
    // - It is never called when autoReconnect=true anyway.
    // See mqtt_client docs for details.
    // client.onFailedConnectionAttempt = ...

    final connMessage = MqttConnectMessage()
        .withClientIdentifier(
            'flutter_client_${DateTime.now().millisecondsSinceEpoch}')
        .startClean()
        .withWillQos(MqttQos.atLeastOnce);

    client.connectionMessage = connMessage;

    try {
      _log('Connecting to MQTT: $host:$port');
      await client.connect();
    } catch (e) {
      _log('MQTT connection error: $e');
      _setConnected(false);
      _connectInFlight = false;
      try {
        client.disconnect();
      } catch (_) {
        // ignore
      }
      return false;
    }

    final connected =
        client.connectionStatus?.state == MqttConnectionState.connected;
    if (!connected) {
      _log('MQTT connection failed: ${client.connectionStatus}');
      _setConnected(false);
      _connectInFlight = false;
      return false;
    }

    _setConnected(true);

    // Subscribe once per live connection.
    _subscribeIfNeeded();

    // Attach updates listener only once (avoid duplicates on reconnect cycles).
    _attachUpdatesListener();

    _connectInFlight = false;
    return true;
  }

  void _subscribeIfNeeded() {
    try {
      client.subscribe(_topic, MqttQos.atLeastOnce);
      _log('Subscribed to: $_topic');
    } catch (e) {
      _log('Subscribe failed: $e');
    }
  }

  void _attachUpdatesListener() {
    // Always cancel old subscription first; avoids duplicates after reconnect cycles.
    _updatesSub?.cancel();
    _updatesSub = null;

    final updates = client.updates;
    if (updates == null) {
      _log('MQTT updates stream is null (no listener attached).');
      return;
    }

    _updatesSub = updates.listen(
      (List<MqttReceivedMessage<MqttMessage>> messages) {
        if (messages.isEmpty) return;

        final msg = messages.first;
        final topic = msg.topic;

        final payloadMsg = msg.payload;
        if (payloadMsg is! MqttPublishMessage) return;

        final payloadStr = MqttPublishPayload.bytesToStringAsString(
            payloadMsg.payload.message);

        final raw = _tryDecodeJsonObject(payloadStr);
        if (raw == null) {
          _log('MQTT payload ignored (not a JSON object). topic=$topic');
          return;
        }

        final nodeId = _extractNodeId(topic: topic, raw: raw);
        if (nodeId <= 0) {
          _log('MQTT message ignored (nodeId missing). topic=$topic');
          return;
        }

        final normalized = _normalizePayload(nodeId, raw);
        onMessageReceived(nodeId, normalized);
      },
      onError: (Object e, StackTrace st) {
        _log('MQTT updates stream error: $e');
      },
      cancelOnError: false,
    );
  }

  Map<String, dynamic>? _tryDecodeJsonObject(String payloadStr) {
    try {
      final decoded = jsonDecode(payloadStr);
      if (decoded is Map<String, dynamic>) return decoded;
      if (decoded is Map) return Map<String, dynamic>.from(decoded);
      return null;
    } catch (_) {
      return null;
    }
  }

  int _extractNodeId(
      {required String topic, required Map<String, dynamic> raw}) {
    // Prefer topic "wusn/sensor/1/data"
    final parts = topic.split('/');
    if (parts.length >= 3) {
      final parsed = int.tryParse(parts[2]);
      if (parsed != null && parsed > 0) return parsed;
    }

    // Fallback: payload nodeId
    final nid = raw['nodeId'] ?? raw['node_id'];
    if (nid is int && nid > 0) return nid;
    if (nid is String) return int.tryParse(nid.trim()) ?? 0;

    return 0;
  }

  Map<String, dynamic> _normalizePayload(int nodeId, Map<String, dynamic> raw) {
    // Accept a variety of upstream key names and map to our app’s standard keys.
    final vwc =
        _toDouble(raw['vwc'] ?? raw['soilMoistureVWC'] ?? raw['moisture']);
    final soilTemp = _toDouble(
        raw['soilTemp'] ?? raw['soilTemperature'] ?? raw['temperature']);

    final bool hasAir =
        raw.containsKey('airTemp') || raw.containsKey('airTemperature');
    final double? airTemp =
        hasAir ? _toDouble(raw['airTemp'] ?? raw['airTemperature']) : null;

    // Keep timestamp if provided; else omit (provider sets DateTime.now().toUtc()).
    final ts = raw['timestamp'] ?? raw['time'] ?? raw['createdAt'];

    final normalized = <String, dynamic>{
      'nodeId': nodeId,
      'vwc': vwc ?? 0.0,
      'soilTemp': soilTemp ?? 0.0,
    };

    if (airTemp != null) normalized['airTemp'] = airTemp;
    if (ts != null) normalized['timestamp'] = ts;

    return normalized;
  }

  double? _toDouble(dynamic v) {
    if (v == null) return null;
    if (v is double) return v;
    if (v is int) return v.toDouble();
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v.trim());
    return null;
  }

  void _setConnected(bool value) {
    if (_isConnected == value) return;
    _isConnected = value;
    onStatusChange(value);
  }

  void _onConnected() {
    _log('MQTT Connected callback');
    _setConnected(true);
    _subscribeIfNeeded();
    _attachUpdatesListener();
  }

  void _onDisconnected() {
    // Per mqtt_client docs, this is not called when autoReconnect=true;
    // auto reconnect callbacks are used instead.
    _log('MQTT Disconnected callback');
    _setConnected(false);
  }

  void _onAutoReconnect() {
    _log('MQTT auto-reconnect starting');
    _setConnected(false);
  }

  void _onAutoReconnected() {
    _log('MQTT auto-reconnect completed');
    _setConnected(true);

    // Re-subscribe and reattach listener defensively.
    _subscribeIfNeeded();
    _attachUpdatesListener();
  }

  void disconnect() {
    _connectInFlight = false;

    _updatesSub?.cancel();
    _updatesSub = null;

    try {
      if (client.connectionStatus?.state == MqttConnectionState.connected) {
        client.disconnect();
      }
    } catch (e) {
      _log('MQTT disconnect error: $e');
    }

    _setConnected(false);
  }

  Future<bool> reconnect() async {
    disconnect();
    await Future.delayed(AppConfig.mqttReconnectDelay);
    return connect();
  }
}
