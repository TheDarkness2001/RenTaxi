import 'api_client.dart';

class DriverRideApi {
  final ApiClient _client = ApiClient();

  Future<Map<String, dynamic>> setOnline(bool isOnline) async {
    return _client.patch('/drivers/status', body: {'isOnline': isOnline});
  }

  Future<List<dynamic>> getOffers() async {
    final data = await _client.get('/drivers/offers');
    return data is List ? data : [];
  }

  Future<Map<String, dynamic>> respondToOffer(String tripId, bool accept) async {
    return _client.post('/drivers/trips/$tripId/respond', body: {'accept': accept});
  }

  Future<Map<String, dynamic>?> getActiveTrip() async {
    final data = await _client.get('/drivers/trips/active');
    if (data == null || (data is Map && data.isEmpty)) return null;
    if (data is Map && data['id'] != null) return Map<String, dynamic>.from(data);
    return null;
  }

  Future<Map<String, dynamic>> advanceTrip(String tripId) async {
    return _client.patch('/drivers/trips/$tripId/advance');
  }
}
