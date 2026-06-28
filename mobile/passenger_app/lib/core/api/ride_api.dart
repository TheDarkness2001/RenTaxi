import 'api_client.dart';

class RideApi {
  final ApiClient _client = ApiClient();

  Future<Map<String, dynamic>> estimate({
    required double pickupLat,
    required double pickupLng,
    required double destLat,
    required double destLng,
    String category = 'economy',
    String rideType = 'fixed',
  }) async {
    return _client.post('/rides/estimate', authenticated: true, body: {
      'pickup': {'lat': pickupLat, 'lng': pickupLng},
      'destination': {'lat': destLat, 'lng': destLng},
      'category': category,
      'rideType': rideType,
    });
  }

  Future<Map<String, dynamic>> createRide({
    required double pickupLat,
    required double pickupLng,
    required String pickupAddress,
    double? destLat,
    double? destLng,
    String? destAddress,
    String category = 'economy',
    String rideType = 'fixed',
    String paymentMethod = 'cash',
    int? offeredPriceUzs,
  }) async {
    return _client.post('/rides', authenticated: true, body: {
      'pickup': {'lat': pickupLat, 'lng': pickupLng, 'address': pickupAddress},
      if (destLat != null && destLng != null)
        'destination': {'lat': destLat, 'lng': destLng, 'address': destAddress ?? ''},
      'category': category,
      'rideType': rideType,
      'paymentMethod': paymentMethod,
      if (offeredPriceUzs != null) 'offeredPriceUzs': offeredPriceUzs,
    });
  }

  Future<List<dynamic>> getHistory() async {
    final data = await _client.get('/rides/history/list', authenticated: true);
    return data is List ? data : [];
  }

  Future<Map<String, dynamic>> getTrip(String tripId) async {
    return _client.get('/rides/$tripId', authenticated: true);
  }

  Future<Map<String, dynamic>> cancelTrip(String tripId, {String? reason}) async {
    return _client.patch('/rides/$tripId/cancel', body: reason != null ? {'reason': reason} : {}, authenticated: true);
  }
}
