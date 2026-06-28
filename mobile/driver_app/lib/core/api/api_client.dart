import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../storage/token_storage.dart';

class ApiClient {
  final TokenStorage _storage = TokenStorage();

  Future<dynamic> get(String path) async => _request('GET', path);
  Future<Map<String, dynamic>> post(String path, {Map<String, dynamic>? body}) async {
    final result = await _request('POST', path, body: body);
    return result is Map<String, dynamic> ? result : {'data': result};
  }

  Future<Map<String, dynamic>> patch(String path, {Map<String, dynamic>? body}) async {
    final result = await _request('PATCH', path, body: body);
    return result is Map<String, dynamic> ? result : {'data': result};
  }

  Future<dynamic> _request(String method, String path, {Map<String, dynamic>? body}) async {
    final token = await _storage.getAccessToken();
    final uri = Uri.parse('${AppConfig.apiBaseUrl}$path');
    final headers = {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };

    late http.Response response;
    switch (method) {
      case 'POST':
        response = await http.post(uri, headers: headers, body: body != null ? jsonEncode(body) : null);
      case 'PATCH':
        response = await http.patch(uri, headers: headers, body: body != null ? jsonEncode(body) : null);
      default:
        response = await http.get(uri, headers: headers);
    }

    if (response.statusCode >= 400) {
      final data = jsonDecode(response.body);
      final msg = data is Map ? (data['error']?['message'] ?? data['message'] ?? 'Error') : 'Error';
      throw Exception(msg);
    }

    if (response.body.isEmpty) return {};
    return jsonDecode(response.body);
  }
}
