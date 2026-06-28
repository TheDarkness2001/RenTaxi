import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../core/config/app_config.dart';
import '../../core/api/ride_api.dart';
import '../../core/location/location_service.dart';
import '../../widgets/taxi_map_widget.dart';
import '../trip/active_trip_screen.dart';

enum RideMode { fixed, meter, offer }

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  RideMode _rideMode = RideMode.fixed;
  final _rideApi = RideApi();
  final _locationService = LocationService();
  Map<String, dynamic>? _estimate;
  bool _loading = false;
  LatLng? _pickup;
  LatLng? _destination;
  LatLng? _driverPosition;

  static final _defaultDest = LatLng(AppConfig.tashkentCenter.lat, AppConfig.tashkentCenter.lng + 0.01);

  @override
  void initState() {
    super.initState();
    _initLocation();
  }

  Future<void> _initLocation() async {
    final loc = await _locationService.getCurrentLocation();
    setState(() {
      _pickup = loc ?? LatLng(AppConfig.tashkentCenter.lat, AppConfig.tashkentCenter.lng);
      _destination = _defaultDest;
    });
  }

  @override
  void dispose() {
    super.dispose();
  }

  Future<void> _fetchEstimate() async {
    if (_pickup == null || _destination == null) return;
    setState(() => _loading = true);
    try {
      final result = await _rideApi.estimate(
        pickupLat: _pickup!.latitude,
        pickupLng: _pickup!.longitude,
        destLat: _destination!.latitude,
        destLng: _destination!.longitude,
        rideType: _rideMode.name,
      );
      setState(() => _estimate = result);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _bookRide() async {
    if (_pickup == null) return;
    setState(() => _loading = true);
    try {
      final result = await _rideApi.createRide(
        pickupLat: _pickup!.latitude,
        pickupLng: _pickup!.longitude,
        pickupAddress: 'Pickup location',
        destLat: _rideMode == RideMode.meter ? null : _destination?.latitude,
        destLng: _rideMode == RideMode.meter ? null : _destination?.longitude,
        destAddress: _rideMode == RideMode.meter ? null : 'Destination',
        rideType: _rideMode.name,
      );
      if (!mounted) return;
      final trip = result['trip'] as Map<String, dynamic>?;
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => ActiveTripScreen(tripId: trip?['id'] as String? ?? ''),
        ),
      );
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          if (_pickup != null)
            TaxiMapWidget(
              initialPosition: _pickup,
              destination: _rideMode != RideMode.meter ? _destination : null,
              driverPosition: _driverPosition,
              showRoute: _destination != null && _rideMode != RideMode.meter,
            )
          else
            const Center(child: CircularProgressIndicator()),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  FloatingActionButton.small(
                    heroTag: 'loc',
                    onPressed: () async {
                      final loc = await _locationService.getCurrentLocation();
                      if (loc != null) setState(() => _pickup = loc);
                    },
                    child: const Icon(Icons.my_location),
                  ),
                ],
              ),
            ),
          ),
          DraggableScrollableSheet(
            initialChildSize: 0.34,
            minChildSize: 0.2,
            maxChildSize: 0.7,
            builder: (_, controller) => Container(
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 20, offset: const Offset(0, -4))],
              ),
              child: ListView(
                controller: controller,
                padding: const EdgeInsets.all(24),
                children: [
                  Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)))),
                  const SizedBox(height: 20),
                  Text('Qayerga?', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 16),
                  _buildRideModeSelector(),
                  if (_estimate != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.primary.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Taxminiy narx', style: TextStyle(fontWeight: FontWeight.w500)),
                          Text(
                            '${(_estimate!['totalUzs'] as num?)?.toStringAsFixed(0) ?? '—'} UZS',
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _loading ? null : _fetchEstimate,
                          child: const Text('Narxni ko\'rish'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: ElevatedButton(
                          onPressed: _loading ? null : _bookRide,
                          child: _loading
                              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : Text(_rideMode == RideMode.offer ? 'Narx taklif qilish' : 'Buyurtma berish'),
                        ),
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

  Widget _buildRideModeSelector() {
    return Row(
      children: RideMode.values.map((mode) {
        final labels = {RideMode.fixed: 'Aniq narx', RideMode.meter: 'Taximeter', RideMode.offer: 'Narx taklif'};
        final selected = _rideMode == mode;
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: GestureDetector(
              onTap: () => setState(() { _rideMode = mode; _estimate = null; }),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: selected ? Theme.of(context).colorScheme.primary.withOpacity(0.12) : Theme.of(context).cardTheme.color,
                  borderRadius: BorderRadius.circular(12),
                  border: selected ? Border.all(color: Theme.of(context).colorScheme.primary) : null,
                ),
                child: Text(labels[mode]!, textAlign: TextAlign.center, style: TextStyle(fontSize: 12, fontWeight: selected ? FontWeight.w600 : FontWeight.w400)),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
