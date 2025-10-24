import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../config/app_config.dart';
import '../models/sensor_data.dart';

class WebSocketService {
  WebSocketChannel? _channel;
  final StreamController<SensorData> _controller = StreamController<SensorData>.broadcast();
  bool _isConnected = false;

  Stream<SensorData> get stream => _controller.stream;
  bool get isConnected => _isConnected;

  void connect() {
    try {
      _channel = WebSocketChannel.connect(Uri.parse(AppConfig.wsUrl));
      _isConnected = true;

      _channel!.stream.listen(
        (message) {
          try {
            final data = json.decode(message);
            if (data['nodeId'] != null) {
              _controller.add(SensorData.fromJson(data));
            }
          } catch (e) {
            print('Error parsing WebSocket message: $e');
          }
        },
        onError: (error) {
          print('WebSocket error: $error');
          _isConnected = false;
          _reconnect();
        },
        onDone: () {
          print('WebSocket connection closed');
          _isConnected = false;
          _reconnect();
        },
      );
    } catch (e) {
      print('WebSocket connection failed: $e');
      _isConnected = false;
      _reconnect();
    }
  }

  void _reconnect() {
    Future.delayed(AppConfig.wsReconnectDelay, () {
      if (!_isConnected) {
        print('Attempting to reconnect WebSocket...');
        connect();
      }
    });
  }

  void dispose() {
    _channel?.sink.close();
    _controller.close();
  }
}
