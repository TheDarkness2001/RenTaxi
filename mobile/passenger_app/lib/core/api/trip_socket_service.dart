import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/app_config.dart';

class TripSocketService {
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

  void joinTrip(String tripId) {
    _socket?.emit('trip:join', {'tripId': tripId});
  }

  void onDriverLocation(void Function(Map<String, dynamic>) handler) {
    _socket?.on('trip:driver_location', (data) {
      if (data is Map) handler(Map<String, dynamic>.from(data));
    });
  }

  void onTripStatus(void Function(Map<String, dynamic>) handler) {
    _socket?.on('trip:status', (data) {
      if (data is Map) handler(Map<String, dynamic>.from(data));
    });
  }

  void dispose() {
    _socket?.dispose();
    _socket = null;
  }
}
