import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../storage/token_storage.dart';

class ApiException implements Exception {
  final int statusCode;
  final String message;
  ApiException(this.statusCode, this.message);

  @override
  String toString() => message;
}

class ApiClient {
  final TokenStorage _tokenStorage = TokenStorage();

  Future<Map<String, dynamic>> post(
    String path, {
    Map<String, dynamic>? body,
    bool authenticated = false,
  }) async {
    return _request('POST', path, body: body, authenticated: authenticated);
  }

  Future<Map<String, dynamic>> get(String path, {bool authenticated = true}) async {
    return _request('GET', path, authenticated: authenticated);
  }

  Future<Map<String, dynamic>> patch(
    String path, {
    Map<String, dynamic>? body,
    bool authenticated = true,
  }) async {
    return _request('PATCH', path, body: body, authenticated: authenticated);
  }

  Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    bool authenticated = false,
  }) async {
    final uri = Uri.parse('${AppConfig.apiBaseUrl}$path');
    final headers = <String, String>{'Content-Type': 'application/json'};

    if (authenticated) {
      final token = await _tokenStorage.getAccessToken();
      if (token != null) headers['Authorization'] = 'Bearer $token';
    }

    final http.Response response;
    try {
      switch (method) {
        case 'POST':
          response = await http.post(uri, headers: headers, body: body != null ? jsonEncode(body) : null);
          break;
        case 'PATCH':
          response = await http.patch(uri, headers: headers, body: body != null ? jsonEncode(body) : null);
          break;
        default:
          response = await http.get(uri, headers: headers);
      }
    } catch (_) {
      throw ApiException(0, 'Serverga ulanib bo\'lmadi. Internetni tekshiring.');
    }

    final data = response.body.isNotEmpty
        ? (jsonDecode(response.body) as Map<String, dynamic>? ?? {})
        : <String, dynamic>{};

    if (response.statusCode >= 400) {
      final error = data['error'];
      String message = 'Request failed';
      if (error is Map && error['message'] != null) {
        message = error['message'].toString();
      } else if (data['message'] != null) {
        message = data['message'].toString();
      }
      throw ApiException(response.statusCode, message);
    }

    return data;
  }
}
