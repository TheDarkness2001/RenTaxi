import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../core/config/app_config.dart';

class TaxiMapWidget extends StatefulWidget {
  final LatLng? initialPosition;
  final LatLng? destination;
  final LatLng? driverPosition;
  final bool showRoute;
  final void Function(LatLng)? onMapTap;

  const TaxiMapWidget({
    super.key,
    this.initialPosition,
    this.destination,
    this.driverPosition,
    this.showRoute = false,
    this.onMapTap,
  });

  @override
  State<TaxiMapWidget> createState() => _TaxiMapWidgetState();
}

class _TaxiMapWidgetState extends State<TaxiMapWidget> {
  GoogleMapController? _controller;

  @override
  Widget build(BuildContext context) {
    final center = widget.initialPosition ??
        LatLng(AppConfig.tashkentCenter.lat, AppConfig.tashkentCenter.lng);

    return GoogleMap(
      initialCameraPosition: CameraPosition(target: center, zoom: 14),
      onMapCreated: (c) => _controller = c,
      onTap: widget.onMapTap,
      myLocationEnabled: true,
      myLocationButtonEnabled: false,
      zoomControlsEnabled: false,
      compassEnabled: false,
      mapToolbarEnabled: false,
      markers: _buildMarkers(),
      polylines: _buildPolylines(),
    );
  }

  Set<Marker> _buildMarkers() {
    final markers = <Marker>{};

    if (widget.initialPosition != null) {
      markers.add(Marker(
        markerId: const MarkerId('pickup'),
        position: widget.initialPosition!,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
        infoWindow: const InfoWindow(title: 'Pickup'),
      ));
    }

    if (widget.destination != null) {
      markers.add(Marker(
        markerId: const MarkerId('destination'),
        position: widget.destination!,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
        infoWindow: const InfoWindow(title: 'Destination'),
      ));
    }

    if (widget.driverPosition != null) {
      markers.add(Marker(
        markerId: const MarkerId('driver'),
        position: widget.driverPosition!,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
        infoWindow: const InfoWindow(title: 'Driver'),
      ));
    }

    return markers;
  }

  Set<Polyline> _buildPolylines() {
    if (!widget.showRoute || widget.initialPosition == null || widget.destination == null) {
      return {};
    }
    return {
      Polyline(
        polylineId: const PolylineId('route'),
        points: [widget.initialPosition!, widget.destination!],
        color: const Color(0xFF007AFF),
        width: 4,
      ),
    };
  }

  void animateTo(LatLng target) {
    _controller?.animateCamera(CameraUpdate.newLatLngZoom(target, 15));
  }
}
