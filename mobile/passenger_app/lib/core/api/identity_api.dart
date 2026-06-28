import 'api_client.dart';
import '../config/app_config.dart';

class IdentityApi {
  final ApiClient _client = ApiClient();

  String _mockStorageUrl(String docType) {
    final base = AppConfig.apiBaseUrl.replaceAll('/v1', '');
    return '$base/mock-kyc/$docType/${DateTime.now().millisecondsSinceEpoch}.jpg';
  }

  Future<Map<String, dynamic>> uploadDocument({
    required String type,
    String? storageUrl,
  }) async {
    return _client.post(
      '/identity/documents',
      body: {
        'type': type,
        'storageUrl': storageUrl ?? _mockStorageUrl(type),
      },
      authenticated: true,
    );
  }

  Future<Map<String, dynamic>> getStatus() async {
    return _client.get('/identity/status', authenticated: true);
  }

  Future<Map<String, dynamic>> submitVerification() async {
    return _client.post('/identity/verify', authenticated: true);
  }
}
