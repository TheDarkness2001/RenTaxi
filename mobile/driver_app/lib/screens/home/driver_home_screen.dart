import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../core/api/driver_api.dart';
import '../../core/api/driver_ride_api.dart';
import '../../core/api/driver_socket_service.dart';
import '../../core/config/app_config.dart';
import '../../core/storage/token_storage.dart';

class DriverHomeScreen extends StatefulWidget {
  const DriverHomeScreen({super.key});

  @override
  State<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends State<DriverHomeScreen> {
  bool _isOnline = false;
  bool _loading = false;
  Map<String, dynamic>? _pendingOffer;
  Map<String, dynamic>? _activeTrip;
  LatLng _position = LatLng(AppConfig.tashkentCenter.lat, AppConfig.tashkentCenter.lng);
  Timer? _locationTimer;

  final _driverApi = DriverApi();
  final _rideApi = DriverRideApi();
  final _socket = DriverSocketService();

  @override
  void initState() {
    super.initState();
    _connectSocket();
  }

  Future<void> _connectSocket() async {
    final token = await TokenStorage().getAccessToken();
    if (token == null) return;
    _socket.connect(token);
    _socket.onNewRide((offer) {
      if (_isOnline && _activeTrip == null) {
        setState(() => _pendingOffer = offer);
      }
    });
  }

  Future<void> _toggleOnline(bool online) async {
    setState(() => _loading = true);
    try {
      await _rideApi.setOnline(online);
      setState(() => _isOnline = online);
      if (online) {
        _startLocationUpdates();
      } else {
        _locationTimer?.cancel();
        setState(() => _pendingOffer = null);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      setState(() => _loading = false);
    }
  }

  void _startLocationUpdates() {
    _locationTimer?.cancel();
    _locationTimer = Timer.periodic(const Duration(seconds: 3), (_) async {
      await _driverApi.updateLocation(
        lat: _position.latitude,
        lng: _position.longitude,
        heading: 0,
        speed: 30,
      );
    });
  }

  Future<void> _respondToOffer(bool accept) async {
    if (_pendingOffer == null) return;
    final tripId = _pendingOffer!['tripId'] as String;
    setState(() => _loading = true);
    try {
      final result = await _rideApi.respondToOffer(tripId, accept);
      if (accept && result['accepted'] == true) {
        setState(() {
          _activeTrip = result['trip'] as Map<String, dynamic>?;
          _pendingOffer = null;
        });
      } else {
        setState(() => _pendingOffer = null);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      setState(() => _pendingOffer = null);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _advanceTrip() async {
    if (_activeTrip == null) return;
    setState(() => _loading = true);
    try {
      final updated = await _rideApi.advanceTrip(_activeTrip!['id'] as String);
      setState(() => _activeTrip = updated);
      if (updated['status'] == 'completed') {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Safar yakunlandi!')),
        );
        setState(() => _activeTrip = null);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _locationTimer?.cancel();
    _socket.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(target: _position, zoom: 14),
            myLocationEnabled: true,
            zoomControlsEnabled: false,
            markers: {
              Marker(markerId: const MarkerId('me'), position: _position),
            },
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.6),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      _activeTrip != null ? 'Safarda' : (_isOnline ? 'Online' : 'Offline'),
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                    ),
                  ),
                  GestureDetector(
                    onTap: _loading ? null : () => _toggleOnline(!_isOnline),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      decoration: BoxDecoration(
                        color: _isOnline ? const Color(0xFF30D158) : Colors.red.shade400,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _isOnline ? 'Online' : 'Offline',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_pendingOffer != null)
            Positioned(
              bottom: _activeTrip != null ? 180 : 100,
              left: 16,
              right: 16,
              child: _RideOfferCard(
                offer: _pendingOffer!,
                onAccept: () => _respondToOffer(true),
                onReject: () => _respondToOffer(false),
              ),
            ),
          if (_activeTrip != null)
            Positioned(
              bottom: 80,
              left: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Theme.of(context).scaffoldBackgroundColor,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 16)],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Safar: ${_activeTrip!['status']}', style: const TextStyle(fontWeight: FontWeight.w700)),
                    Text('${_activeTrip!['priceUzs']} UZS', style: TextStyle(color: Colors.grey.shade600)),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: _loading ? null : _advanceTrip,
                      child: Text(_advanceButtonLabel()),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _advanceButtonLabel() {
    return switch (_activeTrip?['status']) {
      'driver_assigned' => 'Yo\'lga chiqish',
      'driver_arriving' => 'Yetib keldim',
      'picked_up' => 'Safarni boshlash',
      'in_progress' => 'Safarni yakunlash',
      _ => 'Keyingi qadam',
    };
  }
}

class _RideOfferCard extends StatelessWidget {
  final Map<String, dynamic> offer;
  final VoidCallback onAccept;
  final VoidCallback onReject;

  const _RideOfferCard({required this.offer, required this.onAccept, required this.onReject});

  @override
  Widget build(BuildContext context) {
    final pickup = offer['pickup'] as Map<String, dynamic>?;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 20)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Yangi buyurtma', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
          const SizedBox(height: 12),
          Text('${offer['priceUzs']} UZS', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(
            pickup?['address'] as String? ?? 'Pickup nearby · ${offer['category']}',
            style: const TextStyle(color: Colors.grey, fontSize: 13),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: OutlinedButton(onPressed: onReject, child: const Text('Rad etish'))),
              const SizedBox(width: 12),
              Expanded(child: ElevatedButton(onPressed: onAccept, child: const Text('Qabul qilish'))),
            ],
          ),
        ],
      ),
    );
  }
}
