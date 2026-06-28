import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../storage/token_storage.dart';

class DriverApi {
  final TokenStorage _storage = TokenStorage();

  Future<void> updateLocation({
    required double lat,
    required double lng,
    double? heading,
    double? speed,
  }) async {
    final token = await _storage.getAccessToken();
    final uri = Uri.parse('${AppConfig.apiBaseUrl}/drivers/location');
    await http.patch(
      uri,
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'lat': lat, 'lng': lng, 'heading': heading, 'speed': speed}),
    );
  }
}
