import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../core/api/ride_api.dart';
import '../../core/api/trip_socket_service.dart';
import '../../core/storage/token_storage.dart';
import '../../widgets/taxi_map_widget.dart';

class ActiveTripScreen extends StatefulWidget {
  final String tripId;
  const ActiveTripScreen({super.key, required this.tripId});

  @override
  State<ActiveTripScreen> createState() => _ActiveTripScreenState();
}

class _ActiveTripScreenState extends State<ActiveTripScreen> {
  final _rideApi = RideApi();
  final _socket = TripSocketService();
  Map<String, dynamic>? _trip;
  LatLng? _driverPosition;
  String _status = 'searching';

  @override
  void initState() {
    super.initState();
    _loadTrip();
    _connectSocket();
  }

  Future<void> _loadTrip() async {
    try {
      final trip = await _rideApi.getTrip(widget.tripId);
      setState(() {
        _trip = trip;
        _status = trip['status'] as String? ?? 'searching';
      });
    } catch (_) {}
  }

  Future<void> _connectSocket() async {
    final token = await TokenStorage().getAccessToken();
    if (token == null) return;
    _socket.connect(token);
    _socket.joinTrip(widget.tripId);
    _socket.onTripStatus((data) {
      setState(() => _status = data['status'] as String? ?? _status);
    });
    _socket.onDriverLocation((data) {
      setState(() {
        _driverPosition = LatLng(
          (data['lat'] as num).toDouble(),
          (data['lng'] as num).toDouble(),
        );
      });
    });
  }

  @override
  void dispose() {
    _socket.dispose();
    super.dispose();
  }

  String _statusLabel() {
    return switch (_status) {
      'searching' => 'Haydovchi qidirilmoqda...',
      'driver_assigned' => 'Haydovchi biriktirildi',
      'driver_arriving' => 'Haydovchi yo\'lda',
      'picked_up' => 'Safar boshlandi',
      'in_progress' => 'Safar davom etmoqda',
      'completed' => 'Safar yakunlandi',
      _ => _status,
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Safaringiz')),
      body: Stack(
        children: [
          TaxiMapWidget(
            initialPosition: const LatLng(41.2995, 69.2401),
            driverPosition: _driverPosition,
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(_statusLabel(), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  if (_trip != null)
                    Text(
                      '${_trip!['fixedPriceUzs'] ?? _trip!['offeredPriceUzs'] ?? '—'} UZS',
                      style: TextStyle(color: Colors.grey.shade600),
                    ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      IconButton.filledTonal(
                        onPressed: () {},
                        icon: const Icon(Icons.share),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filledTonal(
                        style: IconButton.styleFrom(backgroundColor: Colors.red.withOpacity(0.15)),
                        onPressed: () {},
                        icon: const Icon(Icons.emergency, color: Colors.red),
                      ),
                      const Spacer(),
                      if (_status == 'searching')
                        OutlinedButton(
                          onPressed: () async {
                            await _rideApi.cancelTrip(widget.tripId);
                            if (mounted) Navigator.of(context).pop();
                          },
                          child: const Text('Bekor qilish'),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
