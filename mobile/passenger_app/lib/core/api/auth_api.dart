import 'api_client.dart';
import '../storage/token_storage.dart';

class AuthApi {
  final ApiClient _client = ApiClient();
  final TokenStorage _storage = TokenStorage();

  Future<void> sendOtp(String phone) async {
    await _client.post('/auth/otp/send', body: {'phone': phone, 'locale': 'uz'});
  }

  Future<Map<String, dynamic>> verifyOtp(String phone, String code) async {
    final data = await _client.post('/auth/otp/verify', body: {
      'phone': phone,
      'code': code,
    });

    final access = data['accessToken'] as String?;
    final refresh = data['refreshToken'] as String?;
    if (access != null && refresh != null) {
      await _storage.saveTokens(access: access, refresh: refresh);
    }

    return data;
  }

  Future<Map<String, dynamic>> getMe() async {
    return _client.get('/auth/me', authenticated: true);
  }

  Future<void> logout() async {
    final refresh = await _storage.getRefreshToken();
    if (refresh != null) {
      await _client.post('/auth/logout', body: {'refreshToken': refresh}, authenticated: true);
    }
    await _storage.clear();
  }
}
