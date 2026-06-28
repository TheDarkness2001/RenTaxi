import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/app_config.dart';

class DriverSocketService {
  io.Socket? _socket;

  void connect(String accessToken) {
    _socket?.dispose();
    _socket = io.io(
      '${AppConfig.wsBaseUrl}/trips',
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': accessToken})
          .enableAutoConnect()
          .build(),
    );
  }

  void onNewRide(void Function(Map<String, dynamic>) handler) {
    _socket?.on('driver:new_ride', (data) {
      if (data is Map) handler(Map<String, dynamic>.from(data));
    });
  }

  void dispose() => _socket?.dispose();
}
